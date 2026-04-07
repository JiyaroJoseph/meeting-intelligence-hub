import json
import re
import os
from typing import List, Tuple
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


def _split_sentences(text: str) -> List[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", (text or "").strip()) if s.strip()]


def _extract_deadline(text: str) -> str:
    raw = (text or "")
    m = re.search(
        r"\bby\s+((?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(?:morning|afternoon|evening|noon|eod))?)\b",
        raw,
        flags=re.I,
    )
    if m:
        return f"By {m.group(1).strip().title()}"

    m = re.search(r"\b(tomorrow(?:\s+\d{1,2}(?::\d{2})?\s*(?:am|pm))?)\b", raw, flags=re.I)
    if m:
        return m.group(1).strip().title()

    m = re.search(r"\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)|eod|end of day|noon)\b", raw, flags=re.I)
    if m:
        return m.group(1).strip().upper() if m.group(1).lower() in {"eod", "end of day"} else m.group(1).strip()

    return "Not specified"


def _clean_task_text(text: str) -> str:
    t = (text or "").strip()
    t = re.sub(r"^(?:i|we|he|she|they)\s+(?:will|shall|can|could|would|should)\s+", "", t, flags=re.I)
    t = re.sub(r"^(?:i|we|he|she|they)['’]ll\s+", "", t, flags=re.I)
    t = re.sub(r"\s+", " ", t).strip(" .")
    if not t:
        return ""
    return t[0].upper() + t[1:]


def _looks_like_task_assignment(sentence: str) -> bool:
    low = (sentence or "").lower()
    if "?" in low:
        return False
    if any(k in low for k in ["concern", "risk", "might", "maybe", "if "]):
        return False
    has_commitment = bool(
        re.search(
            r"\b(i\s+will|i['’]ll|we\s+will|we['’]ll|[a-z][a-z\s]{1,30}\s+will|action item|follow up|reach out|check|finalize|prepare|deploy|monitor|set up)\b",
            low,
        )
    )
    return has_commitment


def _extract_task(sentence: str, speaker: str | None) -> Tuple[str, str, str]:
    s = (sentence or "").strip()
    owner = speaker or "Unassigned"
    deadline = _extract_deadline(s)

    named_owner = re.match(r"^([A-Za-z][A-Za-z\s]{1,30})\s+(?:will|shall|can)\s+(.+)$", s)
    if named_owner:
        owner = named_owner.group(1).strip()
        task = _clean_task_text(named_owner.group(2))
        return task, owner, deadline

    fp = re.match(r"^(?:I\s+will|I['’]ll|We\s+will|We['’]ll)\s+(.+)$", s, flags=re.I)
    if fp:
        task = _clean_task_text(fp.group(1))
        return task, owner, deadline

    generic = _clean_task_text(s)
    return generic, owner, deadline


def _looks_like_decision(sentence: str) -> bool:
    low = (sentence or "").lower().strip()
    if not low:
        return False
    if low.endswith("?"):
        return False
    if _looks_like_task_assignment(sentence):
        return False
    if any(k in low for k in ["concern", "risk", "blocked", "might", "budget is still unclear"]):
        return False
    return any(
        k in low
        for k in [
            "final recap",
            "we proceed",
            "we decided",
            "decision",
            "agreed",
            "yes, good idea",
            "good idea",
            "sounds safer",
            "should take priority",
            "need to prioritize",
            "prioritize",
        ]
    )


def _decision_confidence(text: str) -> str:
    low = (text or "").lower()
    if any(k in low for k in ["final recap", "we proceed", "we decided", "agreed"]):
        return "High"
    if any(k in low for k in ["should", "need to", "prioritize", "sounds safer", "good idea"]):
        return "Medium"
    return "Low"


def _build_heuristic_intel(full_text: str) -> tuple[list, list, list]:
    lines = [ln.strip() for ln in (full_text or "").splitlines() if ln.strip()]
    speakers = set()
    sentence_items = []
    for ln in lines:
        speaker, text = _extract_line_parts(ln)
        if speaker:
            speakers.add(speaker)
        for s in _split_sentences(text):
            sentence_items.append({"speaker": speaker, "text": s})

    decisions = []
    actions = []

    for idx, item in enumerate(sentence_items):
        speaker = item.get("speaker")
        text = item.get("text", "")
        low = text.lower()

        if _looks_like_decision(text):
            chosen = text
            if re.fullmatch(r"(?:agreed\.?|yes\.?|good idea\.?|that sounds safer\.?)", low.strip(), flags=re.I):
                prev = sentence_items[idx - 1]["text"] if idx > 0 else ""
                if prev and not prev.endswith("?"):
                    chosen = prev
            mentioned = [sp for sp in sorted(list(speakers)) if re.search(rf"\b{re.escape(sp)}\b", chosen, flags=re.I)]
            stakeholders = mentioned[:4]
            if speaker and speaker not in stakeholders:
                stakeholders.append(speaker)
            if not any((d.get("decision") or "").lower() == chosen.lower() for d in decisions):
                decisions.append(
                    {
                        "id": len(decisions) + 1,
                        "decision": chosen[:220],
                        "context": "",
                        "rationale": "",
                        "confidence": _decision_confidence(chosen),
                        "stakeholders": stakeholders,
                        "dissenters": [],
                    }
                )

        if _looks_like_task_assignment(text):
            task_text, owner, deadline = _extract_task(text, speaker)
            if owner == "Unassigned" or not task_text:
                continue
            if len(task_text.split()) < 3:
                continue
            if not any((a.get("task") or "").lower() == task_text.lower() for a in actions):
                actions.append(
                    {
                        "id": len(actions) + 1,
                        "task": task_text[:220],
                        "owner": owner,
                        "deadline": deadline,
                        "priority": "Medium",
                    }
                )

        if len(decisions) >= 6 and len(actions) >= 8:
            break

    risks = [
        i["text"][:160]
        for i in sentence_items
        if any(k in i["text"].lower() for k in ["risk", "concern", "blocked", "delay", "might exceed", "fallback"])
    ][:3]

    return decisions[:6], actions[:8], risks


def _fallback_intel(full_text: str, meeting_name: str) -> dict:
    decisions, action_items, risk_flags = _build_heuristic_intel(full_text)

    lines = [ln.strip() for ln in (full_text or "").splitlines() if ln.strip()]
    first_sentence = ""
    if lines:
        _, txt = _extract_line_parts(lines[0])
        split = _split_sentences(txt)
        first_sentence = split[0] if split else txt

    if not decisions and first_sentence:
        decisions = [
            {
                "id": 1,
                "decision": first_sentence[:220],
                "context": "",
                "rationale": "",
                "confidence": "Low",
                "stakeholders": [],
                "dissenters": [],
            }
        ]

    key_points = []
    for d in decisions[:3]:
        if d.get("decision"):
            key_points.append(d["decision"][:160])
    for a in action_items[:3]:
        task = (a.get("task") or "").strip()
        owner = (a.get("owner") or "").strip()
        if task:
            key_points.append(f"Action: {task}" + (f" ({owner})" if owner and owner != "Unassigned" else ""))
    key_points = key_points[:5]

    headline = "Meeting summary"
    if decisions:
        headline = decisions[0].get("decision", "Meeting summary")[:120]
    elif action_items:
        headline = action_items[0].get("task", "Meeting summary")[:120]

    return {
        "decisions": decisions,
        "action_items": action_items,
        "brief": {
            "headline": headline,
            "key_points": key_points,
            "risk_flags": risk_flags,
            "overall_outcome": "Neutral",
        },
    }


def _normalize_intel_shape(intel: dict) -> dict:
    if not isinstance(intel, dict):
        return {"decisions": [], "action_items": [], "brief": {"headline": "Meeting summary", "key_points": [], "risk_flags": [], "overall_outcome": "Neutral"}}
    intel.setdefault("decisions", [])
    intel.setdefault("action_items", [])
    intel.setdefault("brief", {})
    intel["brief"].setdefault("headline", "Meeting summary")
    intel["brief"].setdefault("key_points", [])
    intel["brief"].setdefault("risk_flags", [])
    intel["brief"].setdefault("overall_outcome", "Neutral")
    return intel


def _refine_extracted_intel(intel: dict, full_text: str) -> dict:
    intel = _normalize_intel_shape(intel)
    h_decisions, h_actions, h_risks = _build_heuristic_intel(full_text)

    cleaned_decisions = []
    for d in intel.get("decisions", []):
        text = (d.get("decision") or "").strip()
        if not text or not _looks_like_decision(text):
            continue
        if any((x.get("decision") or "").lower() == text.lower() for x in cleaned_decisions):
            continue
        cleaned_decisions.append(
            {
                "id": len(cleaned_decisions) + 1,
                "decision": text[:220],
                "context": (d.get("context") or "")[:220],
                "rationale": (d.get("rationale") or "")[:220],
                "confidence": d.get("confidence") if d.get("confidence") in {"High", "Medium", "Low"} else _decision_confidence(text),
                "stakeholders": d.get("stakeholders") if isinstance(d.get("stakeholders"), list) else [],
                "dissenters": d.get("dissenters") if isinstance(d.get("dissenters"), list) else [],
            }
        )

    for d in h_decisions:
        if len(cleaned_decisions) >= 6:
            break
        if not any((x.get("decision") or "").lower() == (d.get("decision") or "").lower() for x in cleaned_decisions):
            cleaned_decisions.append({**d, "id": len(cleaned_decisions) + 1})

    cleaned_actions = []
    for a in intel.get("action_items", []):
        task = _clean_task_text(a.get("task") or "")
        owner = (a.get("owner") or "").strip()
        if not task or not owner or owner.lower() in {"unknown", "unassigned", "i", "we", "he", "she", "they"}:
            continue
        if len(task.split()) < 3:
            continue
        if any((x.get("task") or "").lower() == task.lower() for x in cleaned_actions):
            continue
        cleaned_actions.append(
            {
                "id": len(cleaned_actions) + 1,
                "task": task[:220],
                "owner": owner,
                "deadline": a.get("deadline") or "Not specified",
                "priority": a.get("priority") if a.get("priority") in {"High", "Medium", "Low"} else "Medium",
            }
        )

    for a in h_actions:
        if len(cleaned_actions) >= 8:
            break
        if not any((x.get("task") or "").lower() == (a.get("task") or "").lower() for x in cleaned_actions):
            cleaned_actions.append({**a, "id": len(cleaned_actions) + 1})

    intel["decisions"] = cleaned_decisions[:6]
    intel["action_items"] = cleaned_actions[:8]
    intel["brief"]["risk_flags"] = (intel["brief"].get("risk_flags") or h_risks)[:3]
    return intel


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
    prompt = f"""You are a precision information extraction system. Extract only what is explicitly supported by the transcript and nothing else.

STRICT RULES:
1. Decisions: Include a decision only if the transcript explicitly shows agreement, confirmation, conclusion, approval, or final recap. Valid signals include phrases such as "agreed", "yes", "confirmed", "let's do", "we'll go with", "that sounds right", "that sounds safer", "proceed", "prioritize", or a final recap that states the chosen outcome. Do NOT treat questions, concerns, suggestions, observations, or uncertainty as decisions.
2. Action items: Include an action item only when a specific person explicitly commits or is directly assigned a task. Valid signals include "I will", "I'll", or a direct assignment with a verb and a named owner. Extract the exact owner name, the exact task description, and the exact deadline if it is stated. If no deadline is stated, use exactly "Not specified". Do NOT invent owners, tasks, or deadlines.
3. No hallucination: Every decision and every action item must be directly traceable to a specific line in the transcript. If you cannot point to an exact line that supports it, exclude it.
4. Quality over quantity: Return fewer items rather than uncertain items. Prefer 3 accurate decisions over 8 weak ones. Prefer 3 accurate tasks over padded results.
5. Do not classify concerns, risks, questions, alternatives, or hypothetical statements as decisions or tasks unless there is explicit agreement or explicit assignment.
6. Keep wording close to the transcript. Do not paraphrase into new meaning. Do not merge unrelated statements.
7. Output JSON only. No markdown, no commentary, no explanation.

TRANSCRIPT ({meeting_name}):
{full_text[:12000]}

Return strictly valid JSON matching this schema and nothing else:
{{
    "decisions": [
        {{
            "id": 1,
            "decision": "A decision that is explicitly agreed or concluded in the transcript",
            "context": "Brief context/reason",
            "rationale": "Why the team made this choice",
            "confidence": "High|Medium|Low",
            "stakeholders": ["Person A"],
            "dissenters": ["Person B"]
        }}
    ],
    "action_items": [
        {{
            "id": 1,
            "task": "A concrete assigned task",
            "owner": "Specific person name",
            "deadline": "By when (or 'Not specified')",
            "priority": "High|Medium|Low"
        }}
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
        parsed = json.loads(raw)
        return _refine_extracted_intel(parsed, full_text)
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
        key_intel = (fallback.get("brief", {}).get("key_points") or [])[:4]
        orders = [a.get("task") for a in fallback.get("action_items", [])[:3] if a.get("task")]

        situation = ""
        if key_intel:
            situation = key_intel[0]

        return {
            "classification": "INTERNAL USE ONLY",
            "mission_name": meeting_name,
            "headline": fallback["brief"].get("headline") or "Meeting summary",
            "situation": situation,
            "key_intel": key_intel,
            "orders": orders,
            "risk_flags": fallback["brief"].get("risk_flags", []),
            "threat_level": "YELLOW",
            "threat_reason": "",
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