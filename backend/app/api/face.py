from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.services.face_service import detect_faces
from app.services.face_verification_service import compare_faces
from app.services.liveness_service import analyze_liveness


router = APIRouter(
    prefix="/api/face",
    tags=["Face Detection & Verification"],
)

UPLOAD_DIR = Path("uploads")


@router.post("/detect")
async def detect_document_face(document_id: str):

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
            detail="Face detection requires an image file.",
        )

    try:

        result = detect_faces(
            str(file_path)
        )

        return {
            "success": True,
            "documentId": document_id,
            "filename": file_path.name,
            "faceAnalysis": result,
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Face detection failed: {str(e)}",
        )


@router.post("/verify")
async def verify_faces(
    document_id: str,
    live_photo_id: str,
):

    document_files = list(
        UPLOAD_DIR.glob(f"{document_id}.*")
    )

    live_files = list(
        UPLOAD_DIR.glob(f"{live_photo_id}.*")
    )

    if not document_files:
        raise HTTPException(
            status_code=404,
            detail="Document image not found.",
        )

    if not live_files:
        raise HTTPException(
            status_code=404,
            detail="Live photo not found.",
        )

    document_path = document_files[0]
    live_path = live_files[0]

    if document_path.suffix.lower() == ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Document face verification requires an image.",
        )

    if live_path.suffix.lower() == ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Live photo must be an image.",
        )

    try:

        result = compare_faces(
            str(document_path),
            str(live_path),
        )

        return {
            "success": True,
            "documentId": document_id,
            "livePhotoId": live_photo_id,
            "faceVerification": result,
        }

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Face verification failed: {str(e)}",
        )


@router.post("/liveness")
async def analyze_live_photo(live_photo_id: str):

    matching_files = list(
        UPLOAD_DIR.glob(f"{live_photo_id}.*")
    )

    if not matching_files:
        raise HTTPException(
            status_code=404,
            detail="Live photo not found.",
        )

    file_path = matching_files[0]

    if file_path.suffix.lower() == ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Liveness analysis requires an image.",
        )

    try:

        result = analyze_liveness(
            str(file_path)
        )

        return {
            "success": True,
            "livePhotoId": live_photo_id,
            "filename": file_path.name,
            "livenessAnalysis": result,
        }

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Liveness analysis failed: {str(e)}",
        )