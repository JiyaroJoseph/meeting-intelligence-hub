from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageTemplate, PageBreak, Frame
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas
from io import BytesIO
from datetime import datetime

# Professional color palette
NAVY_DARK = colors.HexColor("#0f172a")
SLATE_DARK = colors.HexColor("#1e293b")
CHARCOAL = colors.HexColor("#1a1a1a")
WHITE = colors.HexColor("#ffffff")
BLUE_ACCENT = colors.HexColor("#1e40af")
RED_ACCENT = colors.HexColor("#dc2626")
RED_LIGHT = colors.HexColor("#fef2f2")
AMBER_ACCENT = colors.HexColor("#d97706")
GREEN_ACCENT = colors.HexColor("#059669")
GRAY_MID = colors.HexColor("#6b7280")
GRAY_LIGHT = colors.HexColor("#f8fafc")

class HeaderFooterCanvas(canvas.Canvas):
    """Custom canvas to add header and footer to all pages"""
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self.pages = []
    
    def showPage(self):
        self.pages.append(dict(self.__dict__))
        self._startPage()
    
    def save(self):
        page_count = len(self.pages)
        for page_num, page in enumerate(self.pages, 1):
            self.__dict__.update(page)
            # Footer bar background
            self.setFillColor(GRAY_LIGHT)
            self.rect(0, 0, A4[0], 0.8*cm, fill=1, stroke=0)
            
            # Footer top border
            self.setStrokeColor(GRAY_MID)
            self.setLineWidth(0.5)
            self.line(1*cm, 0.8*cm, A4[0]-1*cm, 0.8*cm)
            
            # Footer text
            self.setFont("Helvetica", 8)
            self.setFillColor(GRAY_MID)
            self.drawString(1.5*cm, 0.25*cm, "DEBRIEF · Executive Brief")
            self.drawRightString(A4[0]-1.5*cm, 0.25*cm, f"Page {page_num} · {datetime.now().strftime('%b %d, %Y')}")
            
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

def generate_dossier(meeting_name: str, intel: dict) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4, 
        rightMargin=2*cm, 
        leftMargin=2*cm, 
        topMargin=2.5*cm, 
        bottomMargin=1.5*cm,
        title="DEBRIEF Executive Brief"
    )
    elements = []

    # Color scheme for priority badges
    priority_colors = {
        "High": (RED_ACCENT, colors.HexColor("#fee2e2")),
        "Medium": (AMBER_ACCENT, colors.HexColor("#fef3c7")),
        "Low": (GREEN_ACCENT, colors.HexColor("#dcfce7")),
    }

    # Typography styles
    title_style = ParagraphStyle(
        "Title",
        fontSize=24,
        textColor=WHITE,
        fontName="Helvetica-Bold",
        spaceAfter=0,
        alignment=TA_LEFT
    )
    
    meta_style = ParagraphStyle(
        "Meta",
        fontSize=9,
        textColor=colors.HexColor("#94a3b8"),
        fontName="Helvetica",
        spaceAfter=0,
        alignment=TA_LEFT
    )
    
    section_header_style = ParagraphStyle(
        "SectionHeader",
        fontSize=12,
        textColor=BLUE_ACCENT,
        fontName="Helvetica-Bold",
        spaceAfter=8,
        spaceBefore=12,
        letterSpacing=1
    )
    
    body_style = ParagraphStyle(
        "Body",
        fontSize=10,
        textColor=CHARCOAL,
        fontName="Helvetica",
        spaceAfter=6,
        leading=15
    )
    
    bullet_style = ParagraphStyle(
        "Bullet",
        fontSize=10,
        textColor=CHARCOAL,
        fontName="Helvetica",
        spaceAfter=5,
        leading=15,
        leftIndent=25
    )
    
    headline_style = ParagraphStyle(
        "Headline",
        fontSize=13,
        textColor=CHARCOAL,
        fontName="Helvetica-Bold",
        spaceAfter=6,
        leading=16
    )
    
    risk_style = ParagraphStyle(
        "Risk",
        fontSize=10,
        textColor=RED_ACCENT,
        fontName="Helvetica",
        spaceAfter=4,
        leftIndent=25
    )

    # === HEADER ===
    header_table_data = [[Paragraph("DEBRIEF", title_style), ""]]
    header_table = Table(header_table_data, colWidths=[10*cm, 6*cm])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY_DARK),
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (0, -1), 12),
        ("RIGHTPADDING", (1, 0), (1, -1), 12),
    ]))
    
    elements.append(header_table)
    
    meta_info = f"Executive Brief · {datetime.now().strftime('%B %d, %Y')} · INTERNAL USE ONLY"
    elements.append(Paragraph(meta_info, meta_style))
    elements.append(Spacer(1, 0.3*cm))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=SLATE_DARK))
    elements.append(Spacer(1, 0.4*cm))

    # === BRIEF SUMMARY ===
    brief = intel.get("brief", {})
    if brief and brief.get("headline"):
        summary_table_data = [[Paragraph(brief["headline"], headline_style)]]
        summary_table = Table(summary_table_data, colWidths=[15*cm])
        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#eff6ff")),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("BORDER", (0, 0), (-1, -1), 2, BLUE_ACCENT),
            ("LINEABOVE", (0, 0), (-1, -1), 4, BLUE_ACCENT),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 0.3*cm))

    # Situation paragraph
    if brief and brief.get("situation"):
        elements.append(Paragraph(brief["situation"], body_style))
        elements.append(Spacer(1, 0.3*cm))

    # === KEY POINTS ===
    if brief and brief.get("key_points"):
        elements.append(Spacer(1, 0.1*cm))
        elements.append(Paragraph("KEY POINTS", section_header_style))
        for kp in brief.get("key_points", [])[:5]:
            clean_kp = (kp or "").strip()
            if clean_kp:
                elements.append(Paragraph(f"✓ {clean_kp}", bullet_style))
        elements.append(Spacer(1, 0.3*cm))

    # === DECISIONS TABLE ===
    decisions = intel.get("decisions", [])
    if decisions:
        elements.append(Paragraph("DECISIONS", section_header_style))
        table_data = [["#", "Decision", "Confidence", "Stakeholders"]]
        
        for idx, d in enumerate(decisions[:5], 1):
            confidence = d.get("confidence", "Medium")
            conf_text_color, conf_bg_color = priority_colors.get(confidence, (GRAY_MID, GRAY_LIGHT))
            
            table_data.append([
                str(idx),
                d.get("decision", "")[:80],
                Paragraph(f'<b>{confidence}</b>', 
                         ParagraphStyle("conf", fontSize=9, fontName="Helvetica-Bold", textColor=conf_text_color)),
                ", ".join(d.get("stakeholders", [])[:2])
            ])
        
        table = Table(table_data, colWidths=[0.8*cm, 8*cm, 2.5*cm, 3*cm])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), SLATE_DARK),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, GRAY_LIGHT]),
            ("TEXTCOLOR", (0, 1), (-1, -1), CHARCOAL),
            ("FONTSIZE", (0, 1), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 0.3*cm))

    # === ACTION ITEMS TABLE ===
    actions = intel.get("action_items", [])
    if actions:
        elements.append(Paragraph("ACTION ITEMS", section_header_style))
        table_data = [["#", "Task", "Owner", "Priority"]]
        
        for idx, a in enumerate(actions[:5], 1):
            priority = a.get("priority", "Medium")
            priority_text_color, priority_bg_color = priority_colors.get(priority, (GRAY_MID, GRAY_LIGHT))
            
            table_data.append([
                str(idx),
                a.get("task", "")[:70],
                a.get("owner", "Unassigned")[:20],
                Paragraph(f'<b>{priority}</b>', 
                         ParagraphStyle("pri", fontSize=9, fontName="Helvetica-Bold", textColor=priority_text_color))
            ])
        
        table = Table(table_data, colWidths=[0.8*cm, 8*cm, 3*cm, 2.5*cm])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), SLATE_DARK),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, GRAY_LIGHT]),
            ("TEXTCOLOR", (0, 1), (-1, -1), CHARCOAL),
            ("FONTSIZE", (0, 1), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 0.3*cm))

    # === RISK FLAGS ===
    if brief and brief.get("risk_flags"):
        elements.append(Spacer(1, 0.1*cm))
        elements.append(Paragraph("RISK FLAGS", section_header_style))
        
        for rf in brief.get("risk_flags", [])[:4]:
            clean_rf = (rf or "").strip()
            if clean_rf:
                risk_table_data = [[Paragraph(f"▲ {clean_rf}", risk_style)]]
                risk_table = Table(risk_table_data, colWidths=[15*cm])
                risk_table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), RED_LIGHT),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ("BORDER", (0, 0), (-1, -1), 1, colors.HexColor("#fecaca")),
                ]))
                elements.append(risk_table)
                elements.append(Spacer(1, 0.15*cm))

    # Build PDF with custom footer
    doc.build(elements, canvasmaker=HeaderFooterCanvas)
    return buffer.getvalue()