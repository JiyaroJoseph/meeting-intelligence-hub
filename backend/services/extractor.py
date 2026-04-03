import json
import re
import anthropic
import os
from dotenv import load_dotenv

load_dotenv()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = "claude-sonnet-4-5"

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
    message = client.messages.create(model=MODEL, max_tokens=3000, messages=[{"role": "user", "content": prompt}])
    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = re.sub(r"```[a-z]*\n?", "", raw).strip().rstrip("```").strip()
    try:
        return json.loads(raw)
    except Exception as e:
        print("JSON parsing failed:", e)
        print("Raw response:", raw[:500])  # debug snippet

        return {
            "decisions": [],
            "action_items": [],
            "brief": {
                "headline": "Parsing failed",
                "key_points": [],
                "risk_flags": [],
                "overall_outcome": "Neutral"
            }
        }

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
    message = client.messages.create(model=MODEL, max_tokens=1500, messages=[{"role": "user", "content": prompt}])
    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = re.sub(r"```[a-z]*\n?", "", raw).strip().rstrip("```").strip()
    try:
        return json.loads(raw)
    except Exception as e:
        print("JSON parsing failed:", e)
        print("Raw response:", raw[:500])  # debug snippet

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