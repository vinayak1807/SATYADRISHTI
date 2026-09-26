from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile


router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"],
)


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".pdf",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected.",
        )

    original_filename = file.filename

    extension = Path(original_filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Use JPG, JPEG, PNG or PDF.",
        )

    file_content = await file.read()

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size must be less than 10 MB.",
        )

    document_id = str(uuid4())

    safe_filename = f"{document_id}{extension}"

    file_path = UPLOAD_DIR / safe_filename

    file_path.write_bytes(file_content)

    return {
        "success": True,
        "documentId": document_id,
        "originalFilename": original_filename,
        "filename": safe_filename,
        "documentType": "unknown",
        "size": len(file_content),
        "message": "Document uploaded successfully.",
    }