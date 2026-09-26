from fastapi import APIRouter, HTTPException

from app.services.case_service import get_case
from app.services.verification_result_service import (
    create_verification_result,
    get_verification_result,
)
from app.services.case_analysis_service import run_case_analysis

router = APIRouter(
    prefix="/api/cases",
    tags=["Case Analysis"],
)


@router.post("/{case_id}/analyze")
async def analyze_case(case_id: str):
    try:
        # Verify case exists
        case = get_case(case_id)

        if not case:
            raise HTTPException(
                status_code=404,
                detail="Case not found.",
            )

        # Make sure verification result exists
        verification = get_verification_result(case_id)

        if not verification:
            create_verification_result(case_id)

        # Run complete analysis pipeline
        result = run_case_analysis(case_id)

        return {
            "success": True,
            "caseId": case_id,
            "message": "Case analysis completed successfully.",
            "analysis": result,
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Case analysis failed: {str(e)}",
        )