import json
import re
import os
from dotenv import load_dotenv

import anthropic

load_dotenv()
API_KEY = os.getenv("ANTHROPIC_API_KEY")
client = anthropic.Anthropic(api_key=API_KEY) if API_KEY else None
MODEL = "claude-sonnet-4-5"


def _extract_line_parts(line: str):
    m = re.match(r"^(?:\[[^\]]+\]\s*)?([A-Za-z][A-Za-z\s]{0,30}):\s*(.+)$", (line or "").strip())
    if not m:
        return None, (line or "").strip()
    return m.group(1).strip(), m.group(2).strip()


def _fallback_intel(full_text: str, meeting_name: str) -> dict:
    lines = [ln.strip() for ln in (full_text or "").splitlines() if ln.strip()]
    sentences = []
    speakers = set()
    for ln in lines:
        speaker, text = _extract_line_parts(ln)
        if speaker:
            speakers.add(speaker)
        if text:
            for s in [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]:
                sentences.append({"speaker": speaker, "text": s})

    decision_tokens = ("decid", "agree", "approve", "launch", "ship", "delay", "defer", "postpone", "reject", "cancel", "go with", "move forward")
    action_tokens = ("will", "action", "owner", "deadline", "next step", "follow up", "by ", "todo", "task")

    decisions = []
    for item in sentences:
        s = item["text"]
        speaker = item.get("speaker")
        low = s.lower()
        if any(t in low for t in decision_tokens):
            mentioned = [sp for sp in sorted(list(speakers)) if re.search(rf"\b{re.escape(sp)}\b", s, flags=re.I)]
            stakeholders = mentioned[:4]
            if not stakeholders and speaker:
                stakeholders = [speaker]
            decisions.append(
                {
                    "id": len(decisions) + 1,
                    "decision": s[:220],
                    "context": "Extracted using local transcript analysis.",
                    "rationale": "Inferred from transcript language indicating a decision or direction.",
                    "confidence": "Medium",
                    "stakeholders": stakeholders,
                    "dissenters": [],
                }
            )
        if len(decisions) >= 6:
            break

    action_items = []
    for item in sentences:
        s = item["text"]
        speaker = item.get("speaker")
        low = s.lower()
        if any(t in low for t in action_tokens):
            cleaned_task = re.sub(r"^(?:Action item\.|Action item:?)\s*", "", s, flags=re.I).strip()
            owner = speaker or "Unassigned"
            if owner == "Unknown":
                owner = "Unassigned"
            m = re.search(r"\b([A-Za-z][A-Za-z\s]{0,30})\s+owns?\b", s)
            if m:
                owner = m.group(1).strip()
            elif re.match(r"^I\s+(?:will|own|owns|am|’m|m)\b", cleaned_task, flags=re.I) and speaker:
                owner = speaker
            action_items.append(
                {
                    "id": len(action_items) + 1,
                    "task": cleaned_task[:220],
                    "owner": owner,
                    "deadline": "Not specified",
                    "priority": "Medium",
                }
            )
        if len(action_items) >= 8:
            break

    if not decisions and sentences:
        first_speaker = sentences[0].get("speaker")
        decisions = [
            {
                "id": 1,
                "decision": sentences[0]["text"][:220],
                "context": "Extracted using local transcript analysis.",
                "rationale": "No explicit decision markers found; the first meaningful statement was used.",
                "confidence": "Low",
                "stakeholders": [first_speaker] if first_speaker else [],
                "dissenters": [],
            }
        ]

    return {
        "decisions": decisions,
        "action_items": action_items,
        "brief": {
            "headline": f"{meeting_name}: local transcript analysis generated",
            "key_points": [s["text"][:160] for s in sentences[:5]],
            "risk_flags": [s["text"][:160] for s in sentences if any(k in s["text"].lower() for k in ["risk", "block", "delay", "concern"] )][:3],
            "overall_outcome": "Neutral",
        },
    }


def _strip_code_fence(text: str) -> str:
    raw = (text or "").strip()
    if raw.startswith("```"):
        raw = re.sub(r"```[a-z]*\n?", "", raw).strip().rstrip("```").strip()
    return raw


def _call_llm(prompt: str, max_tokens: int) -> str:
    if not client:
        raise RuntimeError("ANTHROPIC_API_KEY is not configured.")
    message = client.messages.create(model=MODEL, max_tokens=max_tokens, messages=[{"role": "user", "content": prompt}])
    return message.content[0].text.strip()

def extract_intel(full_text: str, meeting_name: str) -> dict:
    prompt = f"""You are an intelligence analyst. Analyze this meeting transcript and extract structured information.

TRANSCRIPT ({meeting_name}):
{full_text[:12000]}

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{{
  "decisions": [
        {{
            "id": 1,
            "decision": "Clear description of what was decided",
            "context": "Brief context/reason",
            "rationale": "Why the team made this choice",
            "confidence": "High|Medium|Low",
            "stakeholders": ["Person A"],
            "dissenters": ["Person B"]
        }}
  ],
  "action_items": [
    {{"id": 1, "task": "What needs to be done", "owner": "Person responsible", "deadline": "By when (or 'Not specified')", "priority": "High|Medium|Low"}}
  ],
  "brief": {{
    "headline": "One punchy sentence summarizing the meeting outcome",
    "key_points": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
    "risk_flags": ["Any risk or concern flagged"],
    "overall_outcome": "Positive|Neutral|Concerning"
  }}
}}"""
    try:
        raw = _strip_code_fence(_call_llm(prompt, 3000))
    except Exception as e:
        print("LLM extraction failed, using fallback:", e)
        return _fallback_intel(full_text, meeting_name)

    try:
        return json.loads(raw)
    except Exception as e:
        print("JSON parsing failed:", e)
        print("Raw response:", raw[:500])
        return _fallback_intel(full_text, meeting_name)

def generate_brief(full_text: str, meeting_name: str) -> dict:
    prompt = f"""You are a senior intelligence analyst preparing a classified executive briefing.

MISSION FILE: {meeting_name}
TRANSCRIPT:
{full_text[:10000]}

Return ONLY valid JSON (no markdown) in this exact format:
{{
  "classification": "INTERNAL USE ONLY",
  "mission_name": "{meeting_name}",
  "headline": "One dramatic punchy sentence",
  "situation": "2-3 sentence tactical overview",
  "key_intel": ["Critical point 1", "Critical point 2", "Critical point 3"],
  "orders": ["Top action item 1", "Top action item 2", "Top action item 3"],
  "risk_flags": ["Risk 1"],
  "threat_level": "GREEN|YELLOW|RED",
  "threat_reason": "One sentence explaining threat level"
}}"""
    try:
        raw = _strip_code_fence(_call_llm(prompt, 1500))
    except Exception as e:
        print("LLM brief generation failed, using fallback:", e)
        fallback = _fallback_intel(full_text, meeting_name)
        return {
            "classification": "INTERNAL USE ONLY",
            "mission_name": meeting_name,
            "headline": fallback["brief"].get("headline") or "Brief generation unavailable",
            "situation": "Generated by local fallback summarizer because model access failed.",
            "key_intel": fallback["brief"].get("key_points", []),
            "orders": [a.get("task") for a in fallback.get("action_items", [])[:3]],
            "risk_flags": fallback["brief"].get("risk_flags", []),
            "threat_level": "YELLOW",
            "threat_reason": "Model unavailable; fallback briefing used.",
        }

    try:
        return json.loads(raw)
    except Exception as e:
        print("JSON parsing failed:", e)
        print("Raw response:", raw[:500])

        return {
            "classification": "INTERNAL USE ONLY",
            "mission_name": meeting_name,
            "headline": "Brief generation unavailable",
            "situation": "The model response could not be parsed into structured briefing format.",
            "key_intel": [],
            "orders": [],
            "risk_flags": ["Unable to parse briefing response"],
            "threat_level": "YELLOW",
            "threat_reason": "Brief parser fallback activated."
        }