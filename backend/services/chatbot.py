import anthropic
import os
import re
import json
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("ANTHROPIC_API_KEY")
client = anthropic.Anthropic(api_key=API_KEY) if API_KEY else None
MODEL = "claude-sonnet-4-5"


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z]{3,}", (text or "").lower())


def _split_transcript_lines(full_text: str) -> list[dict]:
    lines = []
    for raw in [ln.strip() for ln in (full_text or "").splitlines() if ln.strip()]:
        speaker, txt = _extract_speaker_and_text(raw)
        if not txt:
            continue
        lines.append({"raw": raw, "speaker": speaker or "Unknown", "text": txt})
    return lines


def _line_score(question_low: str, question_tokens: set[str], speaker: str, text: str) -> int:
    low = (text or "").lower()
    score = len(question_tokens & set(_tokenize(low)))

    if speaker and speaker.lower() in question_low:
        score += 4
    if any(term in question_low for term in ["why", "reason", "because", "how come"]):
        if any(term in low for term in ["because", "since", "so that", "therefore", "risk", "concern", "budget", "sponsorship", "delay", "availability", "unclear"]):
            score += 3
    if any(term in question_low for term in ["who", "owner", "responsible", "assigned"]):
        if any(term in low for term in ["will", "i'll", "i will", "reach out", "check", "finalize", "prepare", "book", "own", "owner"]):
            score += 3
    if any(term in question_low for term in ["decision", "decide", "agreed", "what did we decide"]):
        if any(term in low for term in ["agreed", "confirmed", "decide", "final recap", "proceed", "we'll", "let's", "sounds right", "take priority", "backup"]):
            score += 3
    if any(term in question_low for term in ["concern", "risk", "problem", "issue"]):
        if any(term in low for term in ["concern", "risk", "issue", "problem", "might", "could", "unclear", "can't", "cannot", "exceed"]):
            score += 4
    if any(term in question_low for term in ["deadline", "when", "by when", "due"]):
        if any(term in low for term in ["monday", "tuesday", "wednesday", "thursday", "friday", "eod", "noon", "am", "pm", "by "]):
            score += 3
    if low.startswith((speaker or "").lower()):
        score += 1

    return score


def _build_candidate_sources(transcripts: list[dict], question: str, limit: int = 10) -> list[dict]:
    question_low = (question or "").lower()
    question_tokens = set(_tokenize(question))
    candidates = []

    for transcript in transcripts:
        meeting_name = transcript.get("name", "Meeting")
        lines = _split_transcript_lines(transcript.get("full_text", ""))
        for idx, item in enumerate(lines):
            score = _line_score(question_low, question_tokens, item["speaker"], item["text"])
            if score <= 0:
                continue

            start = max(0, idx - 1)
            end = min(len(lines), idx + 2)
            context_lines = []
            for context_item in lines[start:end]:
                context_lines.append(f"{context_item['speaker']}: {context_item['text']}")

            candidates.append(
                {
                    "meeting": meeting_name,
                    "speaker": item["speaker"],
                    "excerpt": item["text"][:320],
                    "context": " | ".join(context_lines)[:700],
                    "score": score,
                }
            )

    deduped = []
    seen = set()
    for candidate in sorted(candidates, key=lambda x: (x["score"], len(x["excerpt"])), reverse=True):
        key = (candidate["meeting"], candidate["speaker"], candidate["excerpt"])
        if key in seen:
            continue
        seen.add(key)
        deduped.append(candidate)
        if len(deduped) >= limit:
            break
    return deduped


def _extract_speaker_and_text(line: str) -> tuple[str | None, str]:
    m = re.match(r"^(?:\[[^\]]+\]\s*)?([A-Za-z][A-Za-z\s]{0,30}):\s*(.+)$", (line or "").strip())
    if not m:
        return None, (line or "").strip()
    return m.group(1).strip(), m.group(2).strip()


def _collect_transcript_facts(transcripts: list[dict]) -> dict:
    speaker_counts = {}
    speaker_words = {}
    task_lines = []
    decision_lines = []
    risk_lines = []
    deadline_lines = []

    for t in transcripts:
        meeting_name = t.get("name", "Meeting")
        lines = [ln.strip() for ln in (t.get("full_text") or "").splitlines() if ln.strip()]
        for ln in lines:
            speaker, txt = _extract_speaker_and_text(ln)
            low = (txt or "").lower()
            if speaker:
                speaker_counts[speaker] = speaker_counts.get(speaker, 0) + 1
                speaker_words[speaker] = speaker_words.get(speaker, 0) + len((txt or "").split())

            if any(k in low for k in ["decid", "agreed", "approved", "move forward", "delay", "launch"]):
                decision_lines.append({"meeting": meeting_name, "speaker": speaker or "Unknown", "excerpt": txt[:260]})

            if any(k in low for k in ["will", "action item", "owns", "owner", "follow-up", "next step"]):
                task_lines.append({"meeting": meeting_name, "speaker": speaker or "Unknown", "excerpt": txt[:260]})

            if any(k in low for k in ["risk", "concern", "blocked", "delay", "miss"]):
                risk_lines.append({"meeting": meeting_name, "speaker": speaker or "Unknown", "excerpt": txt[:260]})

            if any(k in low for k in ["monday", "tuesday", "wednesday", "thursday", "friday", "deadline", "eod", "noon", "am", "pm"]):
                deadline_lines.append({"meeting": meeting_name, "speaker": speaker or "Unknown", "excerpt": txt[:260]})

    return {
        "speaker_counts": speaker_counts,
        "speaker_words": speaker_words,
        "task_lines": task_lines,
        "decision_lines": decision_lines,
        "risk_lines": risk_lines,
        "deadline_lines": deadline_lines,
    }


def _intent_answer(question: str, facts: dict) -> dict | None:
    q = (question or "").lower()

    if ("who" in q and "talk" in q and "most" in q) or ("most" in q and "speaker" in q):
        counts = facts.get("speaker_counts", {})
        words = facts.get("speaker_words", {})
        if not counts:
            return None
        top = sorted(counts.items(), key=lambda kv: (kv[1], words.get(kv[0], 0)), reverse=True)[0]
        speaker, turns = top
        return {
            "answer": f"{speaker} talked the most in this meeting ({turns} speaking turns).",
            "citations": [],
            "confidence": "High",
            "found_in_transcripts": True,
        }

    if any(k in q for k in ["decision", "decide", "what was decided"]):
        decisions = facts.get("decision_lines", [])
        if decisions:
            top = decisions[:3]
            bullets = " ".join([f"- {d['excerpt']}" for d in top])
            return {
                "answer": f"Here are the key decision statements I found: {bullets}",
                "citations": top,
                "confidence": "Medium",
                "found_in_transcripts": True,
            }

    if any(k in q for k in ["task", "action", "owner", "responsible", "who is responsible"]):
        tasks = facts.get("task_lines", [])
        if tasks:
            top = tasks[:4]
            bullets = " ".join([f"- {t['speaker']}: {t['excerpt']}" for t in top])
            return {
                "answer": f"These task-related lines appear most relevant: {bullets}",
                "citations": top,
                "confidence": "Medium",
                "found_in_transcripts": True,
            }

    if any(k in q for k in ["risk", "concern", "blocker", "blocked"]):
        risks = facts.get("risk_lines", [])
        if risks:
            top = risks[:3]
            bullets = " ".join([f"- {r['excerpt']}" for r in top])
            return {
                "answer": f"I found these risk or concern mentions: {bullets}",
                "citations": top,
                "confidence": "Medium",
                "found_in_transcripts": True,
            }

    if any(k in q for k in ["deadline", "due", "when", "by when"]):
        deadlines = facts.get("deadline_lines", [])
        if deadlines:
            top = deadlines[:4]
            bullets = " ".join([f"- {d['excerpt']}" for d in top])
            return {
                "answer": f"These timeline or deadline mentions were found: {bullets}",
                "citations": top,
                "confidence": "Medium",
                "found_in_transcripts": True,
            }

    return None


def _local_answer(question: str, transcripts: list[dict]) -> dict:
    q_tokens = set(_tokenize(question))
    q = (question or "").strip()
    q_low = q.lower()

    # Handle conversational prompts like a normal assistant.
    if re.search(r"\b(hi|hello|hey|yo|good morning|good evening)\b", q_low):
        return {
            "answer": "Hi! I can help with this meeting. Ask about decisions, owners, deadlines, risks, or ask me to summarize the discussion.",
            "citations": [],
            "confidence": "Low",
            "found_in_transcripts": False,
        }

    if re.search(r"\b(thanks|thank you|thx)\b", q_low):
        return {
            "answer": "You are welcome. If you want, I can also summarize key decisions and tasks from this meeting.",
            "citations": [],
            "confidence": "Low",
            "found_in_transcripts": False,
        }

    if len(q_tokens) <= 1 and len(q) <= 8:
        return {
            "answer": "I can help with this meeting context. Try asking things like: who owns which tasks, what was decided, or what risks were raised.",
            "citations": [],
            "confidence": "Low",
            "found_in_transcripts": False,
        }

    facts = _collect_transcript_facts(transcripts)
    intent_res = _intent_answer(question, facts)
    if intent_res:
        return intent_res

    candidates = _build_candidate_sources(transcripts, question)
    if not candidates:
        first_citation = None
        for t in transcripts:
            lines = [ln.strip() for ln in (t.get("full_text") or "").splitlines() if ln.strip()]
            if not lines:
                continue
            speaker, txt = _extract_speaker_and_text(lines[0])
            first_citation = {
                "meeting": t.get("name", "Meeting"),
                "speaker": speaker or "Unknown",
                "excerpt": txt[:260],
            }
            break

        if first_citation:
            return {
                "answer": "I could not map that question to a specific line with high confidence. I can still help if you ask about decisions, owners, deadlines, or risks.",
                "citations": [first_citation],
                "confidence": "Low",
                "found_in_transcripts": False,
            }

        return {
            "answer": "I could not find a clear answer in the selected transcripts. Try asking with a little more detail.",
            "citations": [],
            "confidence": "Low",
            "found_in_transcripts": False,
        }

    top = candidates[:3]
    answer_bits = [f"{c['meeting']} · {c['speaker']}: {c['excerpt']}" for c in top]
    return {
        "answer": "Based on the transcripts, the most relevant points are: " + " ".join([f"- {bit}" for bit in answer_bits]),
        "citations": [{"meeting": c["meeting"], "speaker": c["speaker"], "excerpt": c["excerpt"]} for c in top],
        "confidence": "Medium" if top[0]["score"] >= 3 else "Low",
        "found_in_transcripts": True,
    }

def query_transcripts(question: str, transcripts: list[dict]) -> dict:
    sources = _build_candidate_sources(transcripts, question, limit=10)

    context_parts = []
    for i, source in enumerate(sources):
        context_parts.append(
            f"[SOURCE {i+1}]\nMeeting: {source['meeting']}\nSpeaker: {source['speaker']}\nExcerpt: {source['excerpt']}\nContext: {source['context']}"
        )
    context = "\n\n".join(context_parts)

    if not context:
        return _local_answer(question, transcripts)

    prompt = f"""You are an analyst answering a question across multiple meeting transcripts.
Use ONLY the provided source excerpts. Synthesize across meetings when needed. If the question asks "why", explain the reasoning using the evidence in the excerpts. If the question asks for concerns, identify the real concerns raised by the correct speaker. If the question asks for decisions, only state decisions that are explicitly supported by the excerpts.

Always cite your source in the answer using the meeting name and speaker from the excerpts. Prefer 2 to 4 citations when multiple sources support the answer. Do not invent facts that are not in the excerpts.

SOURCE EXCERPTS:
{context}

USER QUESTION: {question}

Respond in this JSON format only (no markdown):
{{
  "answer": "Your detailed answer here",
  "citations": [
    {{"meeting": "Meeting file name", "speaker": "Speaker name if applicable", "excerpt": "Relevant quote or paraphrase (max 2 sentences)"}}
  ],
  "confidence": "High|Medium|Low",
  "found_in_transcripts": true
}}

If the answer is not supported by the excerpts, set found_in_transcripts to false and explain the limitation briefly."""
    try:
        if not client:
            raise RuntimeError("ANTHROPIC_API_KEY is not configured.")
        message = client.messages.create(model=MODEL, max_tokens=1500, messages=[{"role": "user", "content": prompt}])
        raw = message.content[0].text.strip()
        if raw.startswith("```"):
            raw = re.sub(r"```[a-z]*\n?", "", raw).strip().rstrip("```").strip()
    except Exception as e:
        print("Chat model unavailable, using local answer:", e)
        return _local_answer(question, transcripts)

    try:
        return json.loads(raw)
    except Exception as e:
        print("JSON parsing failed:", e)
        print("Raw response:", raw[:500])
        return _local_answer(question, transcripts)