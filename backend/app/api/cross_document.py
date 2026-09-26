from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.cross_document_service import analyze_cross_document


router = APIRouter(
    prefix="/api/cross-document",
    tags=["Cross-Document Intelligence"],
)


class CrossDocumentRequest(BaseModel):
    documents: dict = Field(
        ...,
        description="Extracted fields from passport, visa, and ID card.",
    )


@router.post("/analyze")
async def analyze_documents(
    request: CrossDocumentRequest,
):

    if not request.documents:
        raise HTTPException(
            status_code=400,
            detail="No document data provided.",
        )

    try:

        result = analyze_cross_document(
            request.documents
        )

        return {
            "success": True,
            "crossDocumentAnalysis": result,
        }

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Cross-document analysis failed: {str(e)}",
        )