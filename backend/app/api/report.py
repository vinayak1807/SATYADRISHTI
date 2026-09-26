from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from app.services.report_service import build_report


router = APIRouter(
    prefix="/api/report",
    tags=["Investigation Report"],
)


class ReportRequest(BaseModel):

    documentId: str = Field(
        ...,
        description="Document or case document ID.",
    )

    documentValidation: Optional[dict] = None

    faceVerification: Optional[dict] = None

    liveness: Optional[dict] = None

    tampering: Optional[dict] = None

    crossDocument: Optional[dict] = None

    riskAssessment: Optional[dict] = None


@router.post("/generate")
async def generate_investigation_report(
    request: ReportRequest,
):

    if not request.documentId:
        raise HTTPException(
            status_code=400,
            detail="Document ID is required.",
        )

    try:

        report = build_report(
            document_id=request.documentId,
            document_validation=request.documentValidation,
            face_verification=request.faceVerification,
            liveness=request.liveness,
            tampering=request.tampering,
            cross_document=request.crossDocument,
            risk_assessment=request.riskAssessment,
        )

        return {
            "success": True,
            "report": report,
        }

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Report generation failed: {str(e)}",
        )