from pathlib import Path
from typing import Any
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    KeepTogether,
)

# ============================================================
# SATYADRISTI PDF CONFIGURATION
# ============================================================

# backend/app/services/pdf_report_service.py
# Search both the backend and frontend project roots so the
# Next.js public-folder logo can be used by the Python PDF service.

SERVICE_DIR = Path(__file__).resolve().parent
BACKEND_ROOT = SERVICE_DIR.parents[1]
PROJECT_ROOT = SERVICE_DIR.parents[2]

LOGO_NAME = "PHOTO-2026-09-23-21-32-45.jpg"

LOGO_CANDIDATES = [
    PROJECT_ROOT / "public" / LOGO_NAME,
    PROJECT_ROOT.parent / "public" / LOGO_NAME,
    BACKEND_ROOT / "public" / LOGO_NAME,
    BACKEND_ROOT / "assets" / LOGO_NAME,
    SERVICE_DIR / LOGO_NAME,
]

# Professional government/official-report palette.
NAVY = colors.HexColor("#123B5D")
BLUE = colors.HexColor("#087EA4")
CYAN = colors.HexColor("#18A8C8")
LIGHT_BLUE = colors.HexColor("#EAF4F8")
PALE_BLUE = colors.HexColor("#F5FAFC")
LIGHT_GREY = colors.HexColor("#F3F5F7")
MID_GREY = colors.HexColor("#68737D")
DARK = colors.HexColor("#18232D")
BORDER = colors.HexColor("#C7D0D8")
WHITE = colors.white
GREEN = colors.HexColor("#237A57")
GREEN_BG = colors.HexColor("#EAF6F0")
AMBER = colors.HexColor("#A66A00")
AMBER_BG = colors.HexColor("#FFF6E5")
RED = colors.HexColor("#A72D38")
RED_BG = colors.HexColor("#FBECEE")
CONFIDENTIAL = colors.HexColor("#8B1E2D")


# ============================================================
# HELPERS
# ============================================================

def safe_value(value: Any, default: str = "Not available") -> str:
    if value is None or value == "":
        return default

    if isinstance(value, bool):
        return "Yes" if value else "No"

    if isinstance(value, (list, tuple)):
        if not value:
            return default
        return ", ".join(safe_value(item, "") for item in value)

    if isinstance(value, dict):
        return ", ".join(
            f"{key}: {safe_value(item, '')}"
            for key, item in value.items()
        )

    return str(value)


def _text(value: Any, default: str = "Not available") -> str:
    return escape(safe_value(value, default))


def _compact_text(value: Any, limit: int = 220) -> str:
    text = safe_value(value)
    text = " ".join(text.split())

    if len(text) <= limit:
        return escape(text)

    return escape(text[: limit - 3].rstrip() + "...")


def _find_logo() -> Path | None:
    for path in LOGO_CANDIDATES:
        if path.exists() and path.is_file():
            return path
    return None


def _paragraph(text: Any, style: ParagraphStyle) -> Paragraph:
    return Paragraph(_text(text), style)


def _status_style(value: Any) -> tuple[colors.Color, colors.Color]:
    text = safe_value(value).lower()

    if any(x in text for x in ("high", "reject", "failed", "mismatch", "tamper")):
        return RED, RED_BG

    if any(x in text for x in ("medium", "review", "requires", "pending", "warning")):
        return AMBER, AMBER_BG

    if any(x in text for x in ("low", "approved", "valid", "verified", "completed", "match", "clear")):
        return GREEN, GREEN_BG

    return NAVY, LIGHT_BLUE


def _badge(value: Any, style: ParagraphStyle) -> Table:
    text = safe_value(value)
    fg, bg = _status_style(text)

    badge_style = ParagraphStyle(
        "Badge",
        parent=style,
        fontName="Helvetica-Bold",
        fontSize=7,
        leading=8,
        textColor=fg,
        alignment=TA_CENTER,
    )

    table = Table([[Paragraph(escape(text.upper()), badge_style)]], colWidths=[35 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), bg),
                ("BOX", (0, 0), (-1, -1), 0.5, fg),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return table


def _section_header(number: str, title: str, subtitle: str, styles) -> Table:
    title_style = styles["section_title"]
    sub_style = styles["section_subtitle"]

    content = [
        Paragraph(
            f'<font color="#18A8C8"><b>{escape(number)}</b></font>  '
            f'<font color="#123B5D"><b>{escape(title.upper())}</b></font>',
            title_style,
        ),
        Paragraph(escape(subtitle), sub_style),
    ]

    table = Table([[content]], colWidths=[170 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PALE_BLUE),
                ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
                ("LINEBEFORE", (0, 0), (0, 0), 3, CYAN),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def _kv_table(rows, widths, styles, header=None):
    data = []

    if header:
        data.append(
            [
                Paragraph(escape(str(header[0])), styles["table_header"]),
                Paragraph(escape(str(header[1])), styles["table_header"]),
            ]
        )

    for key, value in rows:
        data.append(
            [
                Paragraph(escape(str(key)), styles["table_label"]),
                Paragraph(_compact_text(value), styles["table_value"]),
            ]
        )

    table = Table(
        data,
        colWidths=widths,
        repeatRows=1 if header else 0,
        hAlign="LEFT",
    )

    commands = [
        ("GRID", (0, 0), (-1, -1), 0.35, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]

    if header:
        commands.extend(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ]
        )
        start = 1
    else:
        start = 0

    for row in range(start, len(data)):
        commands.append(
            (
                "BACKGROUND",
                (0, row),
                (0, row),
                LIGHT_GREY if row % 2 == 0 else PALE_BLUE,
            )
        )

    table.setStyle(TableStyle(commands))
    return table


def _three_column_summary(items, styles):
    cells = []

    for label, value in items:
        fg, bg = _status_style(value)

        value_style = ParagraphStyle(
            "SummaryValue",
            parent=styles["summary_value"],
            textColor=fg,
        )

        block = [
            Paragraph(escape(label.upper()), styles["summary_label"]),
            Spacer(1, 2),
            Paragraph(escape(safe_value(value).upper()), value_style),
        ]

        cells.append(block)

    table = Table([cells], colWidths=[55 * mm, 55 * mm, 55 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), WHITE),
                ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.35, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return table


def _bullet_list(items, style, limit=8):
    flowables = []

    for item in items[:limit]:
        if isinstance(item, dict):
            category = safe_value(item.get("category"), "Finding")
            severity = safe_value(item.get("severity"), "Not specified")
            points = safe_value(item.get("points"), "0")
            message = safe_value(item.get("message"), "No description available")

            text = (
                f"<b>{escape(category)}</b> · "
                f"{escape(severity)} · {escape(points)} points<br/>"
                f"{escape(message)}"
            )
        else:
            text = escape(safe_value(item))

        flowables.append(
            Paragraph(
                f"• {text}",
                style,
            )
        )
        flowables.append(Spacer(1, 3))

    return flowables


# ============================================================
# PAGE HEADER / FOOTER
# ============================================================

def _page_frame(canvas, document):
    canvas.saveState()

    width, height = A4

    # Top rule
    canvas.setStrokeColor(NAVY)
    canvas.setLineWidth(1)
    canvas.line(15 * mm, height - 12 * mm, width - 15 * mm, height - 12 * mm)

    # Confidential marker
    canvas.setFillColor(CONFIDENTIAL)
    canvas.setFont("Helvetica-Bold", 6.5)
    canvas.drawString(
        15 * mm,
        height - 9 * mm,
        "CONFIDENTIAL • AUTHORIZED OFFICER USE ONLY",
    )

    # Footer
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(15 * mm, 13 * mm, width - 15 * mm, 13 * mm)

    canvas.setFillColor(MID_GREY)
    canvas.setFont("Helvetica", 6.5)
    canvas.drawString(
        15 * mm,
        8.5 * mm,
        "SATYADRISTI • AI-Assisted Identity & Document Screening System",
    )

    canvas.drawRightString(
        width - 15 * mm,
        8.5 * mm,
        f"PAGE {document.page}",
    )

    canvas.restoreState()


# ============================================================
# MAIN PDF GENERATOR
# ============================================================

def create_pdf_report(
    report: dict,
    output_path: str,
) -> str:

    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    document = SimpleDocTemplate(
        str(output_file),
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title="Satyadristi Investigation Report",
        author="Satyadristi",
        subject="AI-Assisted Identity & Document Screening Report",
    )

    styles = getSampleStyleSheet()

    styles.add(
        ParagraphStyle(
            "brand",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=21,
            textColor=NAVY,
            spaceAfter=1,
        )
    )
    styles.add(
        ParagraphStyle(
            "brand_sub",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=9,
            textColor=MID_GREY,
        )
    )
    styles.add(
        ParagraphStyle(
            "report_title",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=16,
            textColor=DARK,
        )
    )
    styles.add(
        ParagraphStyle(
            "section_title",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9.5,
            leading=11,
            textColor=NAVY,
        )
    )
    styles.add(
        ParagraphStyle(
            "section_subtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=6.5,
            leading=8,
            textColor=MID_GREY,
            spaceBefore=2,
        )
    )
    styles.add(
        ParagraphStyle(
            "table_header",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7,
            leading=8,
            textColor=WHITE,
        )
    )
    styles.add(
        ParagraphStyle(
            "table_label",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7,
            leading=8.5,
            textColor=NAVY,
        )
    )
    styles.add(
        ParagraphStyle(
            "table_value",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7,
            leading=8.5,
            textColor=DARK,
        )
    )
    styles.add(
        ParagraphStyle(
            "summary_label",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=6.2,
            leading=7,
            textColor=MID_GREY,
        )
    )
    styles.add(
        ParagraphStyle(
            "summary_value",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=10,
            textColor=NAVY,
        )
    )
    styles.add(
        ParagraphStyle(
            "finding",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=6.8,
            leading=8.5,
            textColor=DARK,
        )
    )
    styles.add(
        ParagraphStyle(
            "notice",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=6.5,
            leading=8,
            textColor=MID_GREY,
        )
    )
    styles.add(
        ParagraphStyle(
            "small",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=6.3,
            leading=7.5,
            textColor=DARK,
        )
    )

    story = []

    # ========================================================
    # 1. BRAND HEADER
    # ========================================================

    logo_path = _find_logo()

    if logo_path:
        logo = Image(str(logo_path))
        logo.drawWidth = 17 * mm
        logo.drawHeight = 17 * mm

        brand = [
            Paragraph("SATYADRISTI", styles["brand"]),
            Paragraph(
                "AI-Assisted Identity & Document Screening System",
                styles["brand_sub"],
            ),
        ]

        confidential = [
            Paragraph(
                "<b>CONFIDENTIAL</b>",
                ParagraphStyle(
                    "conf",
                    parent=styles["small"],
                    fontName="Helvetica-Bold",
                    fontSize=7.5,
                    leading=9,
                    textColor=CONFIDENTIAL,
                    alignment=TA_RIGHT,
                ),
            ),
            Paragraph(
                "AUTHORIZED USE ONLY",
                ParagraphStyle(
                    "conf2",
                    parent=styles["small"],
                    fontName="Helvetica-Bold",
                    fontSize=6,
                    leading=7,
                    textColor=MID_GREY,
                    alignment=TA_RIGHT,
                ),
            ),
        ]

        header = Table(
            [[logo, brand, confidential]],
            colWidths=[20 * mm, 105 * mm, 45 * mm],
        )

        header.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ]
            )
        )
        story.append(header)
    else:
        story.append(Paragraph("SATYADRISTI", styles["brand"]))
        story.append(
            Paragraph(
                "AI-Assisted Identity & Document Screening System",
                styles["brand_sub"],
            )
        )

    story.append(Spacer(1, 5))

    title_bar = Table(
        [[
            Paragraph("INVESTIGATION REPORT", styles["report_title"]),
            Paragraph(
                "AI-ASSISTED SCREENING",
                ParagraphStyle(
                    "report_tag",
                    parent=styles["small"],
                    fontName="Helvetica-Bold",
                    fontSize=6.5,
                    leading=8,
                    textColor=BLUE,
                    alignment=TA_RIGHT,
                ),
            ),
        ]],
        colWidths=[125 * mm, 45 * mm],
    )
    title_bar.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BLUE),
                ("BOX", (0, 0), (-1, -1), 0.7, BORDER),
                ("LINEBEFORE", (0, 0), (0, 0), 4, CYAN),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.append(title_bar)
    story.append(Spacer(1, 7))

    # ========================================================
    # 2. CASE INFORMATION
    # ========================================================

    case_info = report.get("caseInformation", {})

    case_rows = [
        ("Case ID", case_info.get("caseId")),
        ("Document ID", case_info.get("documentId")),
        ("Generated At", case_info.get("generatedAt")),
        ("System", case_info.get("system", "Satyadristi")),
    ]

    story.append(
        _section_header(
            "01",
            "Case Information",
            "Reference information associated with this screening report.",
            styles,
        )
    )
    story.append(Spacer(1, 4))
    story.append(
        _kv_table(
            case_rows,
            [38 * mm, 132 * mm],
            styles,
        )
    )
    story.append(Spacer(1, 8))

    # ========================================================
    # 3. SCREENING SUMMARY
    # ========================================================

    validation = report.get("documentAnalysis", {}).get("validation", {})
    biometric = report.get("biometricAnalysis", {})
    face = biometric.get("faceVerification", {})
    liveness = biometric.get("liveness", {})
    liveness_assessment = liveness.get("livenessAssessment", {})
    tampering = report.get("documentIntegrity", {}).get("tampering", {})
    tampering_assessment = tampering.get("tamperingAssessment", {})
    cross_document = report.get("crossDocumentAnalysis", {}).get("result", {})
    risk = report.get("riskAssessment", {})

    face_result = (
        face.get("result")
        or face.get("status")
        or ("Completed" if face.get("comparisonCompleted") else "Not available")
    )

    story.append(
        _section_header(
            "02",
            "Screening Summary",
            "High-level status of the automated screening modules.",
            styles,
        )
    )
    story.append(Spacer(1, 4))

    story.append(
        _three_column_summary(
            [
                ("Document", validation.get("overallStatus")),
                ("Face Verification", face_result),
                ("Liveness", liveness_assessment.get("status")),
            ],
            styles,
        )
    )
    story.append(Spacer(1, 4))
    story.append(
        _three_column_summary(
            [
                ("Document Integrity", tampering_assessment.get("status")),
                ("Cross-Document", cross_document.get("overallStatus")),
                ("Risk", f"{safe_value(risk.get('score'))} / {safe_value(risk.get('level'))}"),
            ],
            styles,
        )
    )
    story.append(Spacer(1, 8))

    # ========================================================
    # 4. DOCUMENT & MRZ
    # ========================================================

    story.append(
        _section_header(
            "03",
            "Document & MRZ Analysis",
            "Validation and machine-readable-zone screening results.",
            styles,
        )
    )
    story.append(Spacer(1, 4))

    document_rows = [
        ("Overall validation", validation.get("overallStatus")),
        ("MRZ available", validation.get("mrzAvailable")),
        ("MRZ checks valid", validation.get("allMrzChecksValid")),
    ]
    story.append(_kv_table(document_rows, [55 * mm, 115 * mm], styles))
    story.append(Spacer(1, 8))

    # ========================================================
    # 5. BIOMETRIC
    # ========================================================

    story.append(
        _section_header(
            "04",
            "Biometric Verification",
            "Face comparison and liveness analysis signals.",
            styles,
        )
    )
    story.append(Spacer(1, 4))

    biometric_rows = [
        ("Face comparison", face_result),
        ("Similarity signal", face.get("similarity")),
        ("Liveness analysis completed", liveness.get("analysisCompleted")),
        ("Liveness status", liveness_assessment.get("status")),
    ]
    story.append(_kv_table(biometric_rows, [65 * mm, 105 * mm], styles))
    story.append(Spacer(1, 8))

    # ========================================================
    # 6. DOCUMENT INTEGRITY
    # ========================================================

    story.append(
        _section_header(
            "05",
            "Document Integrity",
            "Image-quality and tampering-analysis observations.",
            styles,
        )
    )
    story.append(Spacer(1, 4))

    indicators = tampering_assessment.get("indicators", [])

    integrity_rows = [
        ("Analysis completed", tampering.get("analysisCompleted")),
        ("Assessment", tampering_assessment.get("status")),
    ]

    if indicators:
        integrity_rows.append(
            ("Indicators", " • ".join(safe_value(x) for x in indicators[:6]))
        )

    story.append(_kv_table(integrity_rows, [55 * mm, 115 * mm], styles))
    story.append(Spacer(1, 8))

    # ========================================================
    # 7. CROSS-DOCUMENT
    # ========================================================

    story.append(
        _section_header(
            "06",
            "Cross-Document Verification",
            "Comparison of information available across submitted documents.",
            styles,
        )
    )
    story.append(Spacer(1, 4))

    cross_summary = cross_document.get("summary", {})
    matched = cross_summary.get("matchedFields", [])
    mismatched = cross_summary.get("mismatchFields", [])

    cross_rows = [
        ("Overall status", cross_document.get("overallStatus")),
        ("Matched fields", ", ".join(map(str, matched)) if matched else "None reported"),
        ("Mismatched fields", ", ".join(map(str, mismatched)) if mismatched else "None reported"),
    ]

    story.append(_kv_table(cross_rows, [55 * mm, 115 * mm], styles))
    story.append(Spacer(1, 8))

    # ========================================================
    # 8. RISK ASSESSMENT
    # ========================================================

    story.append(
        _section_header(
            "07",
            "Risk Assessment",
            "Automated risk signals generated from the screening modules.",
            styles,
        )
    )
    story.append(Spacer(1, 4))

    risk_score = risk.get("score")
    risk_level = risk.get("level")

    risk_banner = Table(
        [[
            [
                Paragraph("RISK SCORE", styles["summary_label"]),
                Spacer(1, 2),
                Paragraph(
                    escape(safe_value(risk_score)),
                    ParagraphStyle(
                        "RiskScore",
                        parent=styles["summary_value"],
                        fontSize=17,
                        leading=18,
                        textColor=_status_style(risk_level)[0],
                    ),
                ),
            ],
            [
                Paragraph("RISK LEVEL", styles["summary_label"]),
                Spacer(1, 2),
                _badge(risk_level, styles["small"]),
            ],
            [
                [
                    Paragraph("REVIEW", styles["summary_label"]),
                    Spacer(1, 2),
                    Paragraph(
                        "Officer review required",
                        ParagraphStyle(
                            "ReviewRequired",
                            parent=styles["summary_value"],
                            fontSize=7.5,
                            leading=9,
                            textColor=NAVY,
                        ),
                    ),
                ],
            ],
        ]],
        colWidths=[55 * mm, 55 * mm, 60 * mm],
    )
    risk_banner.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), WHITE),
                ("BOX", (0, 0), (-1, -1), 0.7, BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.35, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.append(risk_banner)
    story.append(Spacer(1, 5))

    factors = risk.get("factors", [])

    if factors:
        story.append(
            Paragraph(
                "Risk factors identified",
                ParagraphStyle(
                    "factor_title",
                    parent=styles["table_label"],
                    fontSize=7.5,
                    leading=9,
                    spaceAfter=4,
                ),
            )
        )

        factor_rows = [[
            Paragraph("CATEGORY", styles["table_header"]),
            Paragraph("SEVERITY", styles["table_header"]),
            Paragraph("POINTS", styles["table_header"]),
            Paragraph("OBSERVATION", styles["table_header"]),
        ]]

        for factor in factors[:8]:
            factor_rows.append(
                [
                    Paragraph(_text(factor.get("category"), "Finding"), styles["table_value"]),
                    Paragraph(_text(factor.get("severity"), "Not specified"), styles["table_value"]),
                    Paragraph(_text(factor.get("points"), "0"), styles["table_value"]),
                    Paragraph(_compact_text(factor.get("message"), 250), styles["small"]),
                ]
            )

        factor_table = Table(
            factor_rows,
            colWidths=[32 * mm, 27 * mm, 20 * mm, 91 * mm],
            repeatRows=1,
        )
        factor_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                    ("GRID", (0, 0), (-1, -1), 0.35, BORDER),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PALE_BLUE]),
                ]
            )
        )
        story.append(factor_table)

    story.append(Spacer(1, 8))

    # ========================================================
    # 9. OFFICER REVIEW
    # ========================================================

    officer_review = report.get("officerReview", {})

    story.append(
        _section_header(
            "08",
            "Officer Review & Final Decision",
            "Authorized officer review of the automated screening results.",
            styles,
        )
    )
    story.append(Spacer(1, 4))

    review_status = officer_review.get("status")
    decision = officer_review.get("decision")

    decision_rows = [
        ("Review status", review_status),
        ("Decision", decision),
        ("Reviewed by", officer_review.get("reviewedBy") or "Authorized Officer"),
        ("Remarks", officer_review.get("remarks")),
    ]

    story.append(_kv_table(decision_rows, [45 * mm, 125 * mm], styles))
    story.append(Spacer(1, 5))

    final_status_text = (
        "FINALIZED"
        if safe_value(review_status).lower() == "completed"
        else "PENDING OFFICER REVIEW"
    )

    final_fg, final_bg = _status_style(decision or final_status_text)

    final_box = Table(
        [[
            Paragraph(
                escape(final_status_text),
                ParagraphStyle(
                    "FinalStatus",
                    parent=styles["summary_value"],
                    fontSize=9,
                    leading=11,
                    textColor=final_fg,
                ),
            ),
            Paragraph(
                escape(
                    f"Decision: {safe_value(decision)}"
                    if decision
                    else "No final officer decision recorded."
                ),
                styles["table_value"],
            ),
        ]],
        colWidths=[55 * mm, 115 * mm],
    )
    final_box.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), final_bg),
                ("BOX", (0, 0), (-1, -1), 0.6, final_fg),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(final_box)
    story.append(Spacer(1, 8))

    # ========================================================
    # 10. CLASSIFICATION & NOTICE
    # ========================================================

    story.append(
        _section_header(
            "09",
            "Classification & Notice",
            "Use and interpretation requirements for this report.",
            styles,
        )
    )
    story.append(Spacer(1, 4))

    disclaimer = report.get(
        "disclaimer",
        (
            "Automated analysis is intended to support authorized officer review "
            "and should not be treated as definitive proof of identity, fraud, "
            "or immigration eligibility."
        ),
    )

    notice = Table(
        [[
            Paragraph(
                "CONFIDENTIAL • AUTHORIZED OFFICER USE ONLY",
                ParagraphStyle(
                    "NoticeTitle",
                    parent=styles["small"],
                    fontName="Helvetica-Bold",
                    fontSize=7,
                    leading=8.5,
                    textColor=CONFIDENTIAL,
                ),
            )
        ], [
            Paragraph(_text(disclaimer), styles["notice"])
        ], [
            Paragraph(
                "Satyadristi Prototype / Demonstration System • "
                "AI outputs are decision-support signals and require human review.",
                styles["notice"],
            )
        ]],
        colWidths=[170 * mm],
    )
    notice.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), LIGHT_BLUE),
                ("BACKGROUND", (0, 1), (-1, -1), PALE_BLUE),
                ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(notice)

    # ========================================================
    # BUILD
    # ========================================================

    document.build(
        story,
        onFirstPage=_page_frame,
        onLaterPages=_page_frame,
    )

    return str(output_file)
