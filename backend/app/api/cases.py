from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.case_service import (
    create_case,
    get_case,
    get_all_cases,
    update_case_review,
)
from app.services.case_document_service import (
    add_case_document,
    get_case_documents,
    delete_case_document,
)

router = APIRouter(
    prefix="/api/cases",
    tags=["Case Management"],
)


class CreateCaseRequest(BaseModel):
    documentId: Optional[str] = None
    riskScore: Optional[int] = None
    riskLevel: Optional[str] = None


class ReviewCaseRequest(BaseModel):
    reviewStatus: str
    officerDecision: Optional[str] = None
    officerRemarks: Optional[str] = None

class AddCaseDocumentRequest(BaseModel):
    documentId: str
    documentType: str
    originalFilename: Optional[str] = None
    filePath: Optional[str] = None

def case_to_dict(row):

    if not row:
        return None

    return {
        "id": str(row[0]),
        "caseNumber": row[1],
        "status": row[2],
        "documentId": (
            str(row[3])
            if row[3] is not None
            else None
        ),
        "riskScore": row[4],
        "riskLevel": row[5],
        "reviewStatus": row[6],
        "officerDecision": row[7],
        "officerRemarks": row[8],
        "reportPath": row[9],
        "createdAt": (
            row[10].isoformat()
            if row[10] is not None
            else None
        ),
        "updatedAt": (
            row[11].isoformat()
            if row[11] is not None
            else None
        ),
    }
def case_document_to_dict(row):
    if not row:
        return None

    return {
        "id": str(row[0]),
        "caseId": str(row[1]),
        "documentId": str(row[2]),
        "documentType": row[3],
        "originalFilename": row[4],
        "filePath": row[5],
        "createdAt": row[6].isoformat() if row[6] is not None else None,
    }


@router.post("")
async def create_new_case(
    request: CreateCaseRequest,
):

    try:

        case = create_case(
            document_id=request.documentId,
            risk_score=request.riskScore,
            risk_level=request.riskLevel,
        )

        return {
            "success": True,
            "case": case_to_dict(case),
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Case creation failed: {str(e)}",
        )
@router.get("")
async def get_all_case_details():
    try:
        cases = get_all_cases()

        return {
            "success": True,
            "count": len(cases),
            "cases": [case_to_dict(case) for case in cases],
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve cases: {str(e)}"
        )
    
@router.post("/{case_id}/documents")
async def add_document_to_case(
    case_id: str,
    request: AddCaseDocumentRequest,
):
    try:
        # Verify that the case exists
        case = get_case(case_id)

        if not case:
            raise HTTPException(
                status_code=404,
                detail="Case not found."
            )

        document = add_case_document(
            case_id=case_id,
            document_id=request.documentId,
            document_type=request.documentType,
            original_filename=request.originalFilename,
            file_path=request.filePath,
        )

        return {
            "success": True,
            "document": case_document_to_dict(document),
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add document to case: {str(e)}"
        )

@router.get("/{case_id}/documents")
async def get_documents_for_case(case_id: str):
    try:
        # Verify that the case exists
        case = get_case(case_id)

        if not case:
            raise HTTPException(
                status_code=404,
                detail="Case not found."
            )

        documents = get_case_documents(case_id)

        return {
            "success": True,
            "caseId": case_id,
            "count": len(documents),
            "documents": [
                case_document_to_dict(document)
                for document in documents
            ],
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve case documents: {str(e)}"
        )

@router.delete("/{case_id}/documents/{case_document_id}")
async def remove_document_from_case(
    case_id: str,
    case_document_id: str,
):
    try:
        # Verify that the case exists
        case = get_case(case_id)

        if not case:
            raise HTTPException(
                status_code=404,
                detail="Case not found."
            )

        deleted = delete_case_document(case_document_id)

        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Case document not found."
            )

        return {
            "success": True,
            "message": "Document removed from case successfully.",
            "caseDocumentId": case_document_id,
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to remove case document: {str(e)}"
        )

@router.get("/{case_id}")
async def get_case_details(
    case_id: str,
):

    try:

        case = get_case(
            case_id
        )

        if not case:
            raise HTTPException(
                status_code=404,
                detail="Case not found.",
            )

        return {
            "success": True,
            "case": case_to_dict(case),
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve case: {str(e)}",
        )


@router.patch("/{case_id}/review")
async def review_case(
    case_id: str,
    request: ReviewCaseRequest,
):

    try:

        updated_case = update_case_review(
            case_id=case_id,
            review_status=request.reviewStatus,
            officer_decision=request.officerDecision,
            officer_remarks=request.officerRemarks,
        )

        if not updated_case:
            raise HTTPException(
                status_code=404,
                detail="Case not found.",
            )

        return {
            "success": True,
            "case": case_to_dict(
                updated_case
            ),
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Case review update failed: {str(e)}",
        )