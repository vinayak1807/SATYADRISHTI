from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.case_service import get_case
from app.services.verification_result_service import (
    create_verification_result,
    get_verification_result,
    update_verification_result,
)

router = APIRouter(
    prefix="/api/verification-results",
    tags=["Verification Results"],
)


class CreateVerificationResultRequest(BaseModel):
    caseId: str


class UpdateVerificationResultRequest(BaseModel):
    status: Optional[str] = None

    ocrResult: Optional[dict] = None
    documentValidation: Optional[dict] = None
    mrzResult: Optional[dict] = None

    faceVerification: Optional[dict] = None
    livenessAnalysis: Optional[dict] = None

    tamperingAnalysis: Optional[dict] = None
    crossDocumentAnalysis: Optional[dict] = None

    riskAssessment: Optional[dict] = None
    reportData: Optional[dict] = None

    errorMessage: Optional[str] = None


def verification_result_to_dict(row):
    if not row:
        return None

    return {
        "id": str(row[0]),
        "caseId": str(row[1]),
        "status": row[2],

        "ocrResult": row[3],
        "documentValidation": row[4],
        "mrzResult": row[5],

        "faceVerification": row[6],
        "livenessAnalysis": row[7],

        "tamperingAnalysis": row[8],
        "crossDocumentAnalysis": row[9],

        "riskAssessment": row[10],
        "reportData": row[11],

        "errorMessage": row[12],

        "createdAt": (
            row[13].isoformat()
            if row[13] is not None
            else None
        ),

        "updatedAt": (
            row[14].isoformat()
            if row[14] is not None
            else None
        ),
    }


@router.post("")
async def create_result(
    request: CreateVerificationResultRequest,
):
    try:
        case = get_case(request.caseId)

        if not case:
            raise HTTPException(
                status_code=404,
                detail="Case not found.",
            )

        existing_result = get_verification_result(
            request.caseId
        )

        if existing_result:
            return {
                "success": True,
                "message": "Verification result already exists.",
                "verificationResult": verification_result_to_dict(
                    existing_result
                ),
            }

        result = create_verification_result(
            request.caseId
        )

        return {
            "success": True,
            "message": "Verification result created successfully.",
            "verificationResult": verification_result_to_dict(
                result
            ),
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Verification result creation failed: {str(e)}",
        )


@router.patch("/{case_id}")
async def update_result(
    case_id: str,
    request: UpdateVerificationResultRequest,
):
    try:
        case = get_case(case_id)

        if not case:
            raise HTTPException(
                status_code=404,
                detail="Case not found.",
            )

        existing_result = get_verification_result(case_id)

        if not existing_result:
            raise HTTPException(
                status_code=404,
                detail="Verification result not found. Create it first.",
            )

        result = update_verification_result(
            case_id=case_id,

            status=request.status,

            ocr_result=request.ocrResult,
            document_validation=request.documentValidation,
            mrz_result=request.mrzResult,

            face_verification=request.faceVerification,
            liveness_analysis=request.livenessAnalysis,

            tampering_analysis=request.tamperingAnalysis,
            cross_document_analysis=request.crossDocumentAnalysis,

            risk_assessment=request.riskAssessment,
            report_data=request.reportData,

            error_message=request.errorMessage,
        )

        return {
            "success": True,
            "message": "Verification result updated successfully.",
            "verificationResult": verification_result_to_dict(
                result
            ),
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Verification result update failed: {str(e)}",
        )


@router.get("/{case_id}")
async def get_result(case_id: str):
    try:
        case = get_case(case_id)

        if not case:
            raise HTTPException(
                status_code=404,
                detail="Case not found.",
            )

        result = get_verification_result(case_id)

        if not result:
            raise HTTPException(
                status_code=404,
                detail="Verification result not found.",
            )

        return {
            "success": True,
            "verificationResult": verification_result_to_dict(
                result
            ),
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve verification result: {str(e)}",
        )