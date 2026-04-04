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

    best = None
    best_score = 0

    for t in transcripts:
        lines = [ln.strip() for ln in (t.get("full_text") or "").splitlines() if ln.strip()]
        for ln in lines:
            speaker, txt = _extract_speaker_and_text(ln)
            tokens = set(_tokenize(txt))
            score = len(q_tokens & tokens)
            if score > best_score:
                best_score = score
                best = {
                    "meeting": t.get("name", "Meeting"),
                    "speaker": speaker or "Unknown",
                    "excerpt": txt[:260],
                }

    if not best or best_score == 0:
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

    return {
        "answer": f"Based on the transcript, the most relevant point is: {best['excerpt']}",
        "citations": [best],
        "confidence": "Medium" if best_score >= 2 else "Low",
        "found_in_transcripts": True,
    }

def query_transcripts(question: str, transcripts: list[dict]) -> dict:
    context_parts = []
    for i, t in enumerate(transcripts):
        context_parts.append(f"--- MISSION FILE {i+1}: {t['name']} ---\n{t['full_text'][:6000]}")
    context = "\n\n".join(context_parts)

    prompt = f"""You are an intelligence analyst with access to the following meeting transcripts.
Answer the user's question accurately using ONLY the provided transcript content.
Always cite your source — mention which meeting file and reference the relevant speaker/segment.

TRANSCRIPTS:
{context}

USER QUESTION: {question}

Respond in this JSON format (no markdown):
{{
  "answer": "Your detailed answer here",
  "citations": [
    {{"meeting": "Meeting file name", "speaker": "Speaker name if applicable", "excerpt": "Relevant quote or paraphrase (max 2 sentences)"}}
  ],
  "confidence": "High|Medium|Low",
  "found_in_transcripts": true
}}

If the answer is not found in the transcripts, set found_in_transcripts to false."""
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