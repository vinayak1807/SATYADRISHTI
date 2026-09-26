from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.services.pdf_report_service import create_pdf_report
from app.services.case_service import get_case


router = APIRouter(
    prefix="/api/report",
    tags=["Investigation Report"],
)


REPORT_DIR = Path("reports")
REPORT_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# =========================================================
# PDF Report Generation
# =========================================================

class PDFReportRequest(BaseModel):
    report: dict


@router.post("/pdf")
async def generate_pdf_report(
    request: PDFReportRequest,
):

    if not request.report:
        raise HTTPException(
            status_code=400,
            detail="Report data is required.",
        )

    try:

        case_information = request.report.get(
            "caseInformation",
            {},
        )

        case_id = case_information.get(
            "caseId",
            "unknown-case",
        )

        safe_case_id = "".join(
            character
            for character in str(case_id)
            if character.isalnum()
            or character in "-_"
        )

        if not safe_case_id:
            safe_case_id = "unknown-case"

        output_path = REPORT_DIR / (
            f"{safe_case_id}.pdf"
        )

        pdf_path = create_pdf_report(
            report=request.report,
            output_path=str(output_path),
        )

        return {
            "success": True,
            "caseId": case_id,
            "filename": output_path.name,
            "path": pdf_path,
            "message": (
                "PDF report generated successfully."
            ),
        }

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                f"PDF report generation failed: {str(exc)}"
            ),
        )


# =========================================================
# PDF Download
# =========================================================

@router.get("/pdf/{case_id}")
async def download_pdf_report(
    case_id: str,
):
    try:
        safe_case_id = "".join(
            character
            for character in str(case_id)
            if character.isalnum()
            or character in "-_"
        )

        if not safe_case_id:
            raise HTTPException(
                status_code=400,
                detail="Invalid case ID.",
            )

        # Get the case from the database
        case = get_case(safe_case_id)

        if not case:
            raise HTTPException(
                status_code=404,
                detail="Case not found.",
            )

        # report_path is column index 9 in the cases query
        report_path = case[9]

        if not report_path:
            raise HTTPException(
                status_code=404,
                detail="PDF report has not been generated for this case.",
            )

        pdf_path = Path(report_path)

        if not pdf_path.exists():
            raise HTTPException(
                status_code=404,
                detail="PDF report file not found.",
            )

        return FileResponse(
            path=str(pdf_path),
            media_type="application/pdf",
            filename=pdf_path.name,
        )

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download PDF report: {str(exc)}",
        )