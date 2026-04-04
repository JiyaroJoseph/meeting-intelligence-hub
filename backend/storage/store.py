from typing import Dict, List, Optional
import uuid
from datetime import datetime

meetings: Dict[str, dict] = {}

def create_meeting(name: str, parsed: dict, filename: str) -> dict:
    meeting_id = str(uuid.uuid4())[:8]
    meeting = {
        "id": meeting_id,
        "name": name,
        "filename": filename,
        "uploaded_at": datetime.now().isoformat(),
        "speakers": parsed.get("speakers", []),
        "word_count": parsed.get("word_count", 0),
        "full_text": parsed.get("full_text", ""),
        "segments": parsed.get("segments", []),
        "format": parsed.get("format", "txt"),
        "intel": None,
        "status": "uploaded",
        "error_message": None,
    }
    meetings[meeting_id] = meeting
    return meeting

def get_meeting(meeting_id: str) -> Optional[dict]:
    return meetings.get(meeting_id)

def get_all_meetings() -> List[dict]:
    return list(meetings.values())

def update_intel(meeting_id: str, intel: dict):
    if meeting_id in meetings:
        meetings[meeting_id]["intel"] = intel
        meetings[meeting_id]["status"] = "ready"
        meetings[meeting_id]["error_message"] = None

def set_status(meeting_id: str, status: str, error_message: Optional[str] = None):
    if meeting_id in meetings:
        meetings[meeting_id]["status"] = status
        if status == "error":
            meetings[meeting_id]["error_message"] = error_message or "Analysis failed."
        elif error_message is None:
            meetings[meeting_id]["error_message"] = None

def delete_meeting(meeting_id: str):
    meetings.pop(meeting_id, None)

def rename_meeting(meeting_id: str, name: str) -> Optional[dict]:
    if meeting_id not in meetings:
        return None
    meetings[meeting_id]["name"] = name
    return meetings[meeting_id]