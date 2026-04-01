from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER
from io import BytesIO
from datetime import datetime

BLACK = colors.HexColor("#0a0a0a")
DARK_GRAY = colors.HexColor("#1a1a1a")
MID_GRAY = colors.HexColor("#2a2a2a")
ACCENT = colors.HexColor("#c8a96e")
ACCENT_RED = colors.HexColor("#e05252")
WHITE = colors.HexColor("#f0ede6")
DIM = colors.HexColor("#888888")

def generate_dossier(meeting_name: str, intel: dict) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    elements = []

    title_style = ParagraphStyle("T", fontSize=22, textColor=ACCENT, fontName="Helvetica-Bold", alignment=TA_CENTER, spaceAfter=4, letterSpacing=6)
    subtitle_style = ParagraphStyle("S", fontSize=9, textColor=DIM, fontName="Helvetica", alignment=TA_CENTER, spaceAfter=2, letterSpacing=3)
    section_style = ParagraphStyle("SH", fontSize=10, textColor=ACCENT, fontName="Helvetica-Bold", spaceBefore=14, spaceAfter=6, letterSpacing=3)
    body_style = ParagraphStyle("B", fontSize=9, textColor=WHITE, fontName="Helvetica", spaceAfter=4, leading=14)
    risk_style = ParagraphStyle("R", fontSize=9, textColor=ACCENT_RED, fontName="Helvetica-Bold", spaceAfter=4)

    elements.append(Spacer(1, 0.3*cm))
    elements.append(Paragraph("DEBRIEF", title_style))
    elements.append(Paragraph("CLASSIFIED MISSION INTELLIGENCE REPORT", subtitle_style))
    elements.append(Paragraph(f"MISSION FILE: {meeting_name.upper()}", subtitle_style))
    elements.append(Paragraph(f"GENERATED: {datetime.now().strftime('%Y-%m-%d %H:%M UTC')} · INTERNAL USE ONLY", subtitle_style))
    elements.append(Spacer(1, 0.3*cm))
    elements.append(HRFlowable(width="100%", thickness=1, color=ACCENT))
    elements.append(Spacer(1, 0.4*cm))

    decisions = intel.get("decisions", [])
    if decisions:
        elements.append(Paragraph("INTELLIGENCE — DECISIONS", section_style))
        table_data = [["#", "DECISION", "CONTEXT", "STAKEHOLDERS"]]
        for d in decisions:
            table_data.append([str(d.get("id","")), d.get("decision",""), d.get("context",""), ", ".join(d.get("stakeholders",[]))])
        table = Table(table_data, colWidths=[0.8*cm, 6*cm, 5*cm, 4*cm])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), ACCENT), ("TEXTCOLOR", (0,0), (-1,0), BLACK),
            ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"), ("FONTSIZE", (0,0), (-1,0), 8),
            ("BACKGROUND", (0,1), (-1,-1), MID_GRAY), ("TEXTCOLOR", (0,1), (-1,-1), WHITE),
            ("FONTSIZE", (0,1), (-1,-1), 8), ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [MID_GRAY, DARK_GRAY]),
            ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#444444")),
            ("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 6),
            ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ]))
        elements.append(table)

    actions = intel.get("action_items", [])
    if actions:
        elements.append(Spacer(1, 0.4*cm))
        elements.append(Paragraph("ORDERS — ACTION ITEMS", section_style))
        table_data = [["#", "TASK", "OWNER", "DEADLINE", "PRIORITY"]]
        for a in actions:
            table_data.append([str(a.get("id","")), a.get("task",""), a.get("owner",""), a.get("deadline","TBD"), a.get("priority","Medium")])
        table = Table(table_data, colWidths=[0.8*cm, 6*cm, 3.5*cm, 3*cm, 2.5*cm])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), ACCENT), ("TEXTCOLOR", (0,0), (-1,0), BLACK),
            ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"), ("FONTSIZE", (0,0), (-1,0), 8),
            ("BACKGROUND", (0,1), (-1,-1), MID_GRAY), ("TEXTCOLOR", (0,1), (-1,-1), WHITE),
            ("FONTSIZE", (0,1), (-1,-1), 8), ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [MID_GRAY, DARK_GRAY]),
            ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#444444")),
            ("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 6),
            ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ]))
        elements.append(table)

    brief = intel.get("brief", {})
    if brief:
        elements.append(Spacer(1, 0.4*cm))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=DIM))
        elements.append(Paragraph("EXECUTIVE BRIEF", section_style))
        if brief.get("headline"):
            elements.append(Paragraph(f"► {brief['headline']}", ParagraphStyle("HL", fontSize=10, textColor=ACCENT, fontName="Helvetica-Bold", spaceAfter=8, leading=16)))
        for kp in brief.get("key_points", []):
            elements.append(Paragraph(f"• {kp}", body_style))
        if brief.get("risk_flags"):
            elements.append(Spacer(1, 0.2*cm))
            elements.append(Paragraph("RISK FLAGS", ParagraphStyle("RF", fontSize=9, textColor=ACCENT_RED, fontName="Helvetica-Bold", spaceAfter=4, letterSpacing=2)))
            for rf in brief["risk_flags"]:
                elements.append(Paragraph(f"▲ {rf}", risk_style))

    elements.append(Spacer(1, 0.6*cm))
    elements.append(HRFlowable(width="100%", thickness=1, color=ACCENT))
    elements.append(Spacer(1, 0.2*cm))
    elements.append(Paragraph("DEBRIEF · CONFIDENTIAL · NOT FOR DISTRIBUTION", ParagraphStyle("F", fontSize=7, textColor=DIM, fontName="Helvetica", alignment=TA_CENTER, letterSpacing=2)))

    doc.build(elements)
    return buffer.getvalue()