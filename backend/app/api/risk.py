from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from app.services.risk_service import assess_risk


router = APIRouter(
    prefix="/api/risk",
    tags=["Risk Assessment"],
)


class RiskAssessmentRequest(BaseModel):
    documentValidation: Optional[dict] = Field(
        default=None
    )

    faceVerification: Optional[dict] = Field(
        default=None
    )

    liveness: Optional[dict] = Field(
        default=None
    )

    tampering: Optional[dict] = Field(
        default=None
    )

    crossDocument: Optional[dict] = Field(
        default=None
    )


@router.post("/assess")
async def assess_document_risk(
    request: RiskAssessmentRequest,
):

    try:

        result = assess_risk(
            document_validation=request.documentValidation,
            face_verification=request.faceVerification,
            liveness=request.liveness,
            tampering=request.tampering,
            cross_document=request.crossDocument,
        )

        return {
            "success": True,
            "riskAssessment": result,
        }

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Risk assessment failed: {str(e)}",
        )