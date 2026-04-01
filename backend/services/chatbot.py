import anthropic
import os
import re
import json
from dotenv import load_dotenv

load_dotenv()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = "claude-sonnet-4-5"

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
    message = client.messages.create(model=MODEL, max_tokens=1500, messages=[{"role": "user", "content": prompt}])
    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = re.sub(r"```[a-z]*\n?", "", raw).strip().rstrip("```").strip()
    return json.loads(raw)