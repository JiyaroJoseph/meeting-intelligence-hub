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


def _local_answer(question: str, transcripts: list[dict]) -> dict:
    q_tokens = set(_tokenize(question))
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
        return {
            "answer": "I could not find a clear answer in the selected transcripts.",
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