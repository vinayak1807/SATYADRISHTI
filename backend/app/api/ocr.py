from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.services.ocr_service import extract_text
from app.services.field_extractor import extract_fields
from app.services.mrz_detector import detect_td3_mrz
from app.services.mrz_service import parse_td3
from app.services.document_validator import validate_document



router = APIRouter(
    prefix="/api/ocr",
    tags=["OCR"],
)

UPLOAD_DIR = Path("uploads")


@router.post("/analyze")
async def analyze_document(document_id: str):

    # Find uploaded document
    matching_files = list(
        UPLOAD_DIR.glob(f"{document_id}.*")
    )

    if not matching_files:
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    file_path = matching_files[0]

    # PDF support will be added later
    if file_path.suffix.lower() == ".pdf":
        raise HTTPException(
            status_code=400,
            detail=(
                "PDF OCR will be added in the next step. "
                "Please test with an image for now."
            ),
        )

    try:
        # --------------------------------------------------
        # 1. OCR
        # --------------------------------------------------
        result = extract_text(
            str(file_path)
        )

        # --------------------------------------------------
        # 2. Extract fields from normal OCR text
        # --------------------------------------------------
        fields = extract_fields(
            result["full_text"]
        )

        # --------------------------------------------------
        # 3. Detect MRZ
        # --------------------------------------------------
        mrz_detection = detect_td3_mrz(
            result["text"]
        )

        # --------------------------------------------------
        # 4. Parse MRZ if detected
        # --------------------------------------------------
        mrz_result = None

        if mrz_detection["detected"]:

            mrz_result = parse_td3(
                mrz_detection["line1"],
                mrz_detection["line2"],
            )

            # --------------------------------------------------
            # 5. Use MRZ values as fallback
            #    when normal OCR fields are missing
            # --------------------------------------------------

            # Name
            if fields.get("name") is None:

                surname = mrz_result.get(
                    "surname",
                    ""
                )

                given_names = mrz_result.get(
                    "givenNames",
                    ""
                )

                full_name = (
                    f"{surname} {given_names}"
                ).strip()

                if full_name:
                    fields["name"] = full_name

            # Date of Birth
            if fields.get("dateOfBirth") is None:

                fields["dateOfBirth"] = (
                    mrz_result.get("dateOfBirth")
                )

            # Document / Passport Number
            if fields.get("documentNumber") is None:

                fields["documentNumber"] = (
                    mrz_result.get("passportNumber")
                )

            # Nationality
            if fields.get("nationality") is None:

                fields["nationality"] = (
                    mrz_result.get("nationality")
                )

            # Expiry Date
            if fields.get("expiryDate") is None:

                fields["expiryDate"] = (
                    mrz_result.get("expiryDate")
                )

            validation = validate_document(
               fields,
             mrz_result,
                      )

        # --------------------------------------------------
        # 6. Return complete analysis
        # --------------------------------------------------
        return {
            "success": True,
            "documentId": document_id,
            "filename": file_path.name,

            "ocr": result,

            "fields": fields,
            "validation": validation,

            "mrz": {
                "detected": mrz_detection["detected"],
                "format": mrz_detection["format"],
                "result": mrz_result,
            },
        }
           

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"OCR processing failed: {str(e)}",
        )