from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import csv, io, os
import re
from dotenv import load_dotenv

load_dotenv()

from services.parser import parse_transcript
from services.extractor import extract_intel, generate_brief
from services.chatbot import query_transcripts
from services.pdf_export import generate_dossier
from storage.store import create_meeting, get_meeting, get_all_meetings, update_intel, set_status, delete_meeting

app = FastAPI(title="DEBRIEF API")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

ALLOWED_EXTENSIONS = {".txt", ".vtt"}

class ChatRequest(BaseModel):
    question: str
    meeting_ids: Optional[List[str]] = None

def _tokenize(text: str) -> set:
    words = re.findall(r"[a-zA-Z]{4,}", (text or "").lower())
    return set(words)

def _decision_polarity(text: str) -> str:
    t = (text or "").lower()
    if any(k in t for k in ["delay", "defer", "pause", "postpone", "cancel", "stop"]):
        return "negative"
    if any(k in t for k in ["launch", "ship", "start", "approve", "move forward", "accelerate"]):
        return "positive"
    return "neutral"

def _find_conflicts(meeting_id: str) -> list:
    target = get_meeting(meeting_id)
    if not target or not target.get("intel"):
        return []
    conflicts = []
    target_decisions = target["intel"].get("decisions", [])
    for other in get_all_meetings():
        if other["id"] == meeting_id or not other.get("intel"):
            continue
        other_decisions = other["intel"].get("decisions", [])
        for td in target_decisions:
            for od in other_decisions:
                shared = _tokenize(td.get("decision", "")) & _tokenize(od.get("decision", ""))
                if len(shared) < 2:
                    continue
                tp = _decision_polarity(td.get("decision", ""))
                op = _decision_polarity(od.get("decision", ""))
                if {tp, op} == {"positive", "negative"}:
                    conflicts.append({
                        "topic": ", ".join(sorted(list(shared))[:4]),
                        "severity": "High",
                        "current_meeting": target["name"],
                        "current_decision": td.get("decision", ""),
                        "previous_meeting": other["name"],
                        "previous_decision": od.get("decision", "")
                    })
    return conflicts

def run_extraction(meeting_id: str):
    try:
        set_status(meeting_id, "processing")
        meeting = get_meeting(meeting_id)
        if not meeting:
            return
        intel = extract_intel(meeting["full_text"], meeting["name"])
        update_intel(meeting_id, intel)
    except Exception as e:
        set_status(meeting_id, "error", str(e))
        print(f"Extraction error for {meeting_id}: {e}")

@app.get("/")
def root():
    return {"status": "DEBRIEF API online"}

@app.get("/api/meetings")
def list_meetings():
    return [
        {
            "id": m["id"], "name": m["name"], "filename": m["filename"],
            "uploaded_at": m["uploaded_at"], "speakers": m["speakers"],
            "word_count": m["word_count"], "format": m["format"], "status": m["status"],
            "error_message": m.get("error_message"),
            "action_items_count": len(m["intel"]["action_items"]) if m["intel"] else 0,
            "decisions_count": len(m["intel"]["decisions"]) if m["intel"] else 0,
        }
        for m in get_all_meetings()
    ]

@app.post("/api/meetings/upload")
async def upload_transcript(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'. Allowed: .txt, .vtt")
    content_bytes = await file.read()
    if len(content_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 5MB.")
    content = content_bytes.decode("utf-8", errors="replace")
    parsed = parse_transcript(content, file.filename)
    name = os.path.splitext(file.filename)[0].replace("_", " ").replace("-", " ").title()
    meeting = create_meeting(name, parsed, file.filename)
    background_tasks.add_task(run_extraction, meeting["id"])
    return {"id": meeting["id"], "name": meeting["name"], "speakers": meeting["speakers"], "word_count": meeting["word_count"], "status": meeting["status"]}

@app.get("/api/meetings/{meeting_id}")
def get_meeting_detail(meeting_id: str):
    meeting = get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Mission file not found.")
    return {"id": meeting["id"], "name": meeting["name"], "filename": meeting["filename"],
            "uploaded_at": meeting["uploaded_at"], "speakers": meeting["speakers"],
            "word_count": meeting["word_count"], "status": meeting["status"],
            "error_message": meeting.get("error_message"),
            "segments": meeting.get("segments", []), "intel": meeting["intel"]}

@app.post("/api/meetings/{meeting_id}/reanalyze")
def reanalyze_meeting(meeting_id: str, background_tasks: BackgroundTasks):
    meeting = get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Mission file not found.")
    background_tasks.add_task(run_extraction, meeting_id)
    return {"queued": True, "meeting_id": meeting_id}

@app.get("/api/meetings/{meeting_id}/conflicts")
def meeting_conflicts(meeting_id: str):
    meeting = get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Mission file not found.")
    return {"meeting_id": meeting_id, "conflicts": _find_conflicts(meeting_id)}

@app.delete("/api/meetings/{meeting_id}")
def remove_meeting(meeting_id: str):
    if not get_meeting(meeting_id):
        raise HTTPException(status_code=404, detail="Mission file not found.")
    delete_meeting(meeting_id)
    return {"deleted": meeting_id}

@app.post("/api/meetings/{meeting_id}/brief")
def get_brief(meeting_id: str):
    meeting = get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Mission file not found.")
    if meeting["status"] != "ready":
        raise HTTPException(status_code=400, detail="Mission file not ready yet.")
    try:
        return generate_brief(meeting["full_text"], meeting["name"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
def chat(req: ChatRequest):
    all_meetings = get_all_meetings()
    selected = [m for m in all_meetings if m["id"] in req.meeting_ids] if req.meeting_ids else [m for m in all_meetings if m["status"] == "ready"]
    if not selected:
        raise HTTPException(status_code=400, detail="No ready mission files available.")
    transcripts = [{"name": m["name"], "full_text": m["full_text"]} for m in selected]
    try:
        return query_transcripts(req.question, transcripts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/meetings/{meeting_id}/export/csv")
def export_csv(meeting_id: str):
    meeting = get_meeting(meeting_id)
    if not meeting or not meeting["intel"]:
        raise HTTPException(status_code=404, detail="No intel available.")
    intel = meeting["intel"]
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["DEBRIEF EXPORT", meeting["name"]])
    writer.writerow([])
    writer.writerow(["=== DECISIONS ==="])
    writer.writerow(["#", "Decision", "Context", "Stakeholders"])
    for d in intel.get("decisions", []):
        writer.writerow([d.get("id"), d.get("decision"), d.get("context"), ", ".join(d.get("stakeholders", []))])
    writer.writerow([])
    writer.writerow(["=== ACTION ITEMS ==="])
    writer.writerow(["#", "Task", "Owner", "Deadline", "Priority"])
    for a in intel.get("action_items", []):
        writer.writerow([a.get("id"), a.get("task"), a.get("owner"), a.get("deadline"), a.get("priority")])
    output.seek(0)
    filename = f"debrief_{meeting['name'].replace(' ', '_')}.csv"
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={filename}"})

@app.get("/api/meetings/{meeting_id}/export/pdf")
def export_pdf(meeting_id: str):
    meeting = get_meeting(meeting_id)
    if not meeting or not meeting["intel"]:
        raise HTTPException(status_code=404, detail="No intel available.")
    try:
        pdf_bytes = generate_dossier(meeting["name"], meeting["intel"])
        filename = f"debrief_{meeting['name'].replace(' ', '_')}.pdf"
        return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    