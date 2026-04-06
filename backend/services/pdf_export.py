from datetime import datetime
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


PAGE_BG = colors.HexColor("#0f172a")
PANEL_BG = colors.HexColor("#111827")
PANEL_BG_ALT = colors.HexColor("#0b1220")
CARD_BG = colors.HexColor("#172554")
HEADER_BG = colors.HexColor("#020617")
TEXT = colors.HexColor("#e5e7eb")
TEXT_MID = colors.HexColor("#cbd5e1")
TEXT_DIM = colors.HexColor("#94a3b8")
ACCENT = colors.HexColor("#1e40af")
ACCENT_SOFT = colors.HexColor("#60a5fa")
RED = colors.HexColor("#dc2626")
RED_SOFT = colors.HexColor("#fef2f2")
AMBER = colors.HexColor("#d97706")
GREEN = colors.HexColor("#059669")
LINE = colors.HexColor("#334155")
WHITE = colors.HexColor("#ffffff")


def generate_dossier(meeting_name: str, intel: dict) -> bytes:
    buffer = BytesIO()
    document_date = datetime.now().strftime("%B %d, %Y")

    def page_decorations(canvas, doc):
        canvas.saveState()

        page_width, page_height = A4

        canvas.setFillColor(PAGE_BG)
        canvas.rect(0, 0, page_width, page_height, fill=1, stroke=0)

        header_height = 1.9 * cm
        canvas.setFillColor(HEADER_BG)
        canvas.rect(0, page_height - header_height, page_width, header_height, fill=1, stroke=0)

        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.9)
        canvas.line(doc.leftMargin, page_height - header_height, page_width - doc.rightMargin, page_height - header_height)

        canvas.setFillColor(WHITE)
        canvas.setFont("Helvetica-Bold", 16)
        canvas.drawString(doc.leftMargin, page_height - 1.0 * cm, "DEBRIEF")

        canvas.setFillColor(TEXT_MID)
        canvas.setFont("Helvetica", 8.5)
        canvas.drawString(doc.leftMargin, page_height - 1.45 * cm, meeting_name)
        canvas.drawRightString(
            page_width - doc.rightMargin,
            page_height - 1.0 * cm,
            f"Executive Brief · {document_date} · INTERNAL USE ONLY",
        )

        footer_height = 0.85 * cm
        canvas.setFillColor(PANEL_BG)
        canvas.rect(0, 0, page_width, footer_height, fill=1, stroke=0)
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.6)
        canvas.line(doc.leftMargin, footer_height, page_width - doc.rightMargin, footer_height)

        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(TEXT_DIM)
        canvas.drawString(doc.leftMargin, 0.25 * cm, "DEBRIEF · Executive Brief")
        canvas.drawRightString(page_width - doc.rightMargin, 0.25 * cm, f"Page {canvas.getPageNumber()} · {document_date}")

        canvas.restoreState()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=3.0 * cm,
        bottomMargin=1.35 * cm,
        title="DEBRIEF Executive Brief",
        author="DEBRIEF",
    )

    title_style = ParagraphStyle(
        "Title",
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=20,
        textColor=WHITE,
        alignment=TA_LEFT,
        spaceAfter=0,
    )
    meta_style = ParagraphStyle(
        "Meta",
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=TEXT_DIM,
        alignment=TA_RIGHT,
        spaceAfter=0,
    )
    section_label_style = ParagraphStyle(
        "SectionLabel",
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=14,
        textColor=ACCENT_SOFT,
        spaceAfter=0,
    )
    body_style = ParagraphStyle(
        "Body",
        fontName="Helvetica",
        fontSize=10,
        leading=16,
        textColor=TEXT_MID,
        spaceAfter=6,
    )
    body_strong_style = ParagraphStyle(
        "BodyStrong",
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=16,
        textColor=TEXT,
        spaceAfter=4,
    )
    bullet_style = ParagraphStyle(
        "Bullet",
        fontName="Helvetica",
        fontSize=10,
        leading=16,
        textColor=TEXT,
        leftIndent=16,
        bulletIndent=0,
        spaceAfter=4,
    )
    cell_style = ParagraphStyle(
        "Cell",
        fontName="Helvetica",
        fontSize=9.2,
        leading=12,
        textColor=TEXT,
        spaceAfter=0,
    )
    header_cell_style = ParagraphStyle(
        "HeaderCell",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11,
        textColor=WHITE,
        alignment=TA_LEFT,
    )
    center_cell_style = ParagraphStyle(
        "CenterCell",
        fontName="Helvetica-Bold",
        fontSize=8.8,
        leading=10,
        textColor=WHITE,
        alignment=TA_LEFT,
    )
    risk_style = ParagraphStyle(
        "Risk",
        fontName="Helvetica",
        fontSize=9.5,
        leading=13,
        textColor=RED,
        spaceAfter=0,
    )

    def section_header(title: str):
        block = Table(
            [[Paragraph(title.upper(), section_label_style)]],
            colWidths=[16.6 * cm],
        )
        block.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (0, 0), PANEL_BG),
                    ("LINEBEFORE", (0, 0), (0, 0), 5, ACCENT),
                    ("LEFTPADDING", (0, 0), (0, 0), 10),
                    ("RIGHTPADDING", (0, 0), (0, 0), 10),
                    ("TOPPADDING", (0, 0), (0, 0), 6),
                    ("BOTTOMPADDING", (0, 0), (0, 0), 6),
                ]
            )
        )
        return block

    def card(flowables, background=PANEL_BG):
        panel = Table([[flowables]], colWidths=[16.6 * cm])
        panel.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), background),
                    ("BOX", (0, 0), (-1, -1), 0.7, LINE),
                    ("LEFTPADDING", (0, 0), (-1, -1), 12),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                    ("TOPPADDING", (0, 0), (-1, -1), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ]
            )
        )
        return panel

    def soft_divider():
        return HRFlowable(width="100%", thickness=0.8, color=LINE, spaceBefore=6, spaceAfter=6)

    elements = []

    brief = intel.get("brief", {}) or {}
    headline = (brief.get("headline") or "").strip()
    situation = (brief.get("situation") or "").strip()
    key_points = [point.strip() for point in (brief.get("key_points") or []) if (point or "").strip()]
    risk_flags = [flag.strip() for flag in (brief.get("risk_flags") or []) if (flag or "").strip()]

    elements.append(section_header("Summary"))

    summary_inner = []
    if headline:
        summary_inner.append(Paragraph(headline, body_strong_style))
    if situation:
        summary_inner.append(Spacer(1, 0.08 * cm))
        summary_inner.append(Paragraph(situation, body_style))

    if summary_inner:
        summary_card = Table(
            [["", summary_inner]],
            colWidths=[0.22 * cm, 16.38 * cm],
        )
        summary_card.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (0, 0), ACCENT),
                    ("BACKGROUND", (1, 0), (1, 0), CARD_BG),
                    ("BOX", (0, 0), (-1, -1), 0.7, LINE),
                    ("LEFTPADDING", (0, 0), (0, 0), 0),
                    ("RIGHTPADDING", (0, 0), (0, 0), 0),
                    ("TOPPADDING", (0, 0), (0, 0), 0),
                    ("BOTTOMPADDING", (0, 0), (0, 0), 0),
                    ("LEFTPADDING", (1, 0), (1, 0), 12),
                    ("RIGHTPADDING", (1, 0), (1, 0), 12),
                    ("TOPPADDING", (1, 0), (1, 0), 10),
                    ("BOTTOMPADDING", (1, 0), (1, 0), 10),
                ]
            )
        )
        elements.append(summary_card)
        elements.append(Spacer(1, 0.18 * cm))

    if key_points:
        elements.append(section_header("Key Points"))
        bullet_items = [Paragraph(f"✓ {point}", bullet_style) for point in key_points[:5]]
        elements.append(card(bullet_items, background=PANEL_BG_ALT))
        elements.append(Spacer(1, 0.18 * cm))

    if situation and not headline:
        elements.append(card([Paragraph(situation, body_style)], background=PANEL_BG_ALT))
        elements.append(Spacer(1, 0.18 * cm))

    decisions = intel.get("decisions", []) or []
    if decisions:
        elements.append(section_header("Decisions"))

        table_data = [[
            Paragraph("#", header_cell_style),
            Paragraph("Decision", header_cell_style),
            Paragraph("Confidence", header_cell_style),
            Paragraph("Stakeholders", header_cell_style),
        ]]

        confidence_colors = {
            "High": (GREEN, colors.HexColor("#0f2e24")),
            "Medium": (AMBER, colors.HexColor("#2f2310")),
            "Low": (RED, colors.HexColor("#2f1212")),
        }

        for idx, decision in enumerate(decisions[:5], 1):
            confidence = (decision.get("confidence") or "Medium").title()
            stakeholders = ", ".join((decision.get("stakeholders") or [])[:2]) or "Unassigned"
            table_data.append(
                [
                    Paragraph(str(idx), center_cell_style),
                    Paragraph(decision.get("decision", ""), cell_style),
                    Paragraph(confidence, center_cell_style),
                    Paragraph(stakeholders, cell_style),
                ]
            )

        decisions_table = Table(
            table_data,
            colWidths=[0.8 * cm, 8.6 * cm, 2.8 * cm, 4.4 * cm],
            repeatRows=1,
        )
        style_commands = [
            ("BACKGROUND", (0, 0), (-1, 0), PANEL_BG),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [PANEL_BG_ALT, PANEL_BG]),
            ("BOX", (0, 0), (-1, -1), 0.8, LINE),
            ("GRID", (0, 0), (-1, -1), 0.35, LINE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ]
        for row_index, decision in enumerate(decisions[:5], 1):
            confidence = (decision.get("confidence") or "Medium").title()
            text_color, background = confidence_colors.get(confidence, (TEXT, PANEL_BG))
            style_commands.extend(
                [
                    ("BACKGROUND", (2, row_index), (2, row_index), background),
                    ("TEXTCOLOR", (2, row_index), (2, row_index), text_color),
                    ("ALIGN", (2, row_index), (2, row_index), "CENTER"),
                    ("BOX", (2, row_index), (2, row_index), 0.4, text_color),
                ]
            )
        decisions_table.setStyle(TableStyle(style_commands))
        elements.append(decisions_table)
        elements.append(Spacer(1, 0.18 * cm))

    actions = intel.get("action_items", []) or []
    if actions:
        elements.append(section_header("Action Items"))

        table_data = [[
            Paragraph("#", header_cell_style),
            Paragraph("Task", header_cell_style),
            Paragraph("Owner", header_cell_style),
            Paragraph("Priority", header_cell_style),
        ]]

        priority_colors = {
            "High": (RED, colors.HexColor("#2f1212")),
            "Medium": (AMBER, colors.HexColor("#2f2310")),
            "Low": (GREEN, colors.HexColor("#0f2e24")),
        }

        for idx, action in enumerate(actions[:5], 1):
            priority = (action.get("priority") or "Medium").title()
            owner = action.get("owner") or "Unassigned"
            table_data.append(
                [
                    Paragraph(str(idx), center_cell_style),
                    Paragraph(action.get("task", ""), cell_style),
                    Paragraph(owner, cell_style),
                    Paragraph(priority, center_cell_style),
                ]
            )

        actions_table = Table(
            table_data,
            colWidths=[0.8 * cm, 9.2 * cm, 3.1 * cm, 2.7 * cm],
            repeatRows=1,
        )
        style_commands = [
            ("BACKGROUND", (0, 0), (-1, 0), PANEL_BG),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [PANEL_BG_ALT, PANEL_BG]),
            ("BOX", (0, 0), (-1, -1), 0.8, LINE),
            ("GRID", (0, 0), (-1, -1), 0.35, LINE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ]
        for row_index, action in enumerate(actions[:5], 1):
            priority = (action.get("priority") or "Medium").title()
            text_color, background = priority_colors.get(priority, (TEXT, PANEL_BG))
            style_commands.extend(
                [
                    ("BACKGROUND", (3, row_index), (3, row_index), background),
                    ("TEXTCOLOR", (3, row_index), (3, row_index), text_color),
                    ("ALIGN", (3, row_index), (3, row_index), "CENTER"),
                    ("BOX", (3, row_index), (3, row_index), 0.4, text_color),
                ]
            )
        actions_table.setStyle(TableStyle(style_commands))
        elements.append(actions_table)
        elements.append(Spacer(1, 0.18 * cm))

    if risk_flags:
        elements.append(section_header("Risk Flags"))

        for flag in risk_flags[:4]:
            risk_row = Table(
                [[Paragraph(f"▲ {flag}", risk_style)]],
                colWidths=[16.6 * cm],
            )
            risk_row.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, -1), RED_SOFT),
                        ("TEXTCOLOR", (0, 0), (-1, -1), RED),
                        ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#fecaca")),
                        ("LEFTPADDING", (0, 0), (-1, -1), 10),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                        ("TOPPADDING", (0, 0), (-1, -1), 7),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                    ]
                )
            )
            elements.append(risk_row)
            elements.append(Spacer(1, 0.12 * cm))

    if not (headline or situation or key_points or decisions or actions or risk_flags):
        elements.append(section_header("Summary"))
        elements.append(card([Paragraph("No executive brief data was available for this meeting.", body_style)], background=PANEL_BG_ALT))

    elements.append(Spacer(1, 0.2 * cm))
    elements.append(soft_divider())

    doc.build(elements, onFirstPage=page_decorations, onLaterPages=page_decorations)
    return buffer.getvalue()
