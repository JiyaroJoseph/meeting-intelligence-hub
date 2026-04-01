import re
from typing import Dict

def parse_transcript(content: str, filename: str) -> Dict:
    if filename.endswith(".vtt"):
        return parse_vtt(content)
    else:
        return parse_txt(content)

def parse_vtt(content: str) -> Dict:
    lines = content.strip().split("\n")
    segments = []
    speakers = set()
    word_count = 0
    i = 0
    while i < len(lines) and not lines[i].strip().startswith("00:"):
        i += 1
    current_time = None
    current_text_lines = []
    for line in lines[i:]:
        line = line.strip()
        if re.match(r"\d{2}:\d{2}[\:\.]", line):
            if current_time and current_text_lines:
                text = " ".join(current_text_lines)
                speaker, clean_text = extract_speaker(text)
                if speaker:
                    speakers.add(speaker)
                word_count += len(clean_text.split())
                segments.append({"time": current_time, "speaker": speaker or "Unknown", "text": clean_text})
            current_time = line.split(" --> ")[0].strip()
            current_text_lines = []
        elif line and not line.isdigit():
            current_text_lines.append(line)
    if current_time and current_text_lines:
        text = " ".join(current_text_lines)
        speaker, clean_text = extract_speaker(text)
        if speaker:
            speakers.add(speaker)
        word_count += len(clean_text.split())
        segments.append({"time": current_time, "speaker": speaker or "Unknown", "text": clean_text})
    full_text = "\n".join(f"[{s['time']}] {s['speaker']}: {s['text']}" for s in segments)
    return {"segments": segments, "speakers": list(speakers), "word_count": word_count, "full_text": full_text, "format": "vtt"}

def parse_txt(content: str) -> Dict:
    lines = content.strip().split("\n")
    segments = []
    speakers = set()
    word_count = 0
    for line in lines:
        line = line.strip()
        if not line:
            continue
        speaker, clean_text = extract_speaker(line)
        if speaker:
            speakers.add(speaker)
        word_count += len(clean_text.split())
        segments.append({"time": None, "speaker": speaker or "Unknown", "text": clean_text})
    full_text = "\n".join(f"{s['speaker']}: {s['text']}" for s in segments)
    return {"segments": segments, "speakers": list(speakers), "word_count": word_count, "full_text": full_text, "format": "txt"}

def extract_speaker(line: str):
    match = re.match(r"^([A-Za-z][A-Za-z\s]{0,30}):\s+(.+)$", line)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    match = re.match(r"^\[([^\]]+)\]\s+(.+)$", line)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return None, line