from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.services.tampering_service import analyze_tampering


router = APIRouter(
    prefix="/api/tampering",
    tags=["Document Tampering"],
)

UPLOAD_DIR = Path("uploads")


@router.post("/analyze")
async def analyze_document_tampering(
    document_id: str,
):

    matching_files = list(
        UPLOAD_DIR.glob(f"{document_id}.*")
    )

    if not matching_files:
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    file_path = matching_files[0]

    if file_path.suffix.lower() == ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Tampering analysis currently requires an image file.",
        )

    try:

        result = analyze_tampering(
            str(file_path)
        )

        return {
            "success": True,
            "documentId": document_id,
            "filename": file_path.name,
            "tamperingAnalysis": result,
        }

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Tampering analysis failed: {str(e)}",
        )