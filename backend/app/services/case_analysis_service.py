from pathlib import Path

from app.services.audit_log_service import create_audit_log
from app.services.case_document_service import get_case_documents
from app.services.case_service import (
    update_case_analysis_summary,
    update_case_report_path,
)
from app.services.cross_document_service import analyze_cross_document
from app.services.document_validator import validate_document
from app.services.face_verification_service import compare_faces
from app.services.field_extractor import extract_fields
from app.services.liveness_service import analyze_liveness
from app.services.mrz_detector import detect_td3_mrz
from app.services.mrz_service import parse_td3
from app.services.ocr_service import extract_text
from app.services.pdf_report_service import create_pdf_report
from app.services.report_service import build_report
from app.services.risk_service import assess_risk
from app.services.tampering_service import analyze_tampering
from app.services.verification_result_service import (
    get_verification_result,
    update_verification_result,
)


# ---------------------------------------------------------
# Directories
# ---------------------------------------------------------

BACKEND_DIR = Path(__file__).resolve().parents[2]

UPLOAD_DIR = BACKEND_DIR / "uploads"

REPORT_DIR = BACKEND_DIR / "reports"
REPORT_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------
# Convert database row into document dictionary
# ---------------------------------------------------------

def row_to_document(row):
    return {
        "id": str(row[0]),
        "caseId": str(row[1]),
        "documentId": str(row[2]),
        "documentType": row[3],
        "originalFilename": row[4],
        "filePath": row[5],
        "createdAt": row[6].isoformat() if row[6] else None,
    }


# ---------------------------------------------------------
# Find uploaded document file
# ---------------------------------------------------------

def find_document_path(document_id: str):
    matching_files = list(
        UPLOAD_DIR.glob(f"{document_id}.*")
    )

    if not matching_files:
        return None

    return matching_files[0].resolve()


# ---------------------------------------------------------
# Main automated case analysis pipeline
# ---------------------------------------------------------

def run_case_analysis(case_id: str):

    verification = get_verification_result(case_id)

    if not verification:
        raise ValueError(
            "Verification result not found. Create it before starting analysis."
        )

    rows = get_case_documents(case_id)

    if not rows:
        raise ValueError(
            "No documents are attached to this case."
        )

    documents = [
        row_to_document(row)
        for row in rows
    ]

    # -----------------------------------------------------
    # Identify document types
    # -----------------------------------------------------

    passport = None
    visa = None
    id_card = None
    live_photo = None

    for document in documents:

        document_type = (
            document["documentType"]
            .strip()
            .lower()
        )

        if document_type == "passport":
            passport = document

        elif document_type == "visa":
            visa = document

        elif document_type in {
            "id_card",
            "id-card",
            "identity_card",
            "identity-card",
        }:
            id_card = document

        elif document_type in {
            "live_photo",
            "live-photo",
            "selfie",
        }:
            live_photo = document

    # -----------------------------------------------------
    # Result container
    # -----------------------------------------------------

    result = {
        "status": "running",
        "ocrResult": None,
        "documentValidation": None,
        "mrzResult": None,
        "faceVerification": None,
        "livenessAnalysis": None,
        "tamperingAnalysis": None,
        "crossDocumentAnalysis": None,
        "riskAssessment": None,
        "reportData": None,
        "reportPdf": None,
        "errorMessage": None,
    }

    def audit_module(
        action: str,
        description: str,
        metadata: dict | None = None,
    ):
        create_audit_log(
            case_id=case_id,
            action=action,
            actor_type="system",
            description=description,
            metadata=metadata,
        )

    try:

        # =================================================
        # 1. OCR + MRZ + Document Validation
        # =================================================

        primary_document = passport

        if primary_document is None:
            primary_document = documents[0]

        primary_path = find_document_path(
            primary_document["documentId"]
        )

        if primary_path is None:
            raise ValueError(
                "Primary document file not found in uploads."
            )

        if primary_path.suffix.lower() == ".pdf":
            raise ValueError(
                "Primary document PDF analysis is not supported yet."
            )

        # -------------------------------------------------
        # OCR
        # -------------------------------------------------

        ocr = extract_text(
            str(primary_path)
        )

        # -------------------------------------------------
        # Extract normal document fields
        # -------------------------------------------------

        fields = extract_fields(
            ocr["full_text"]
        )

        # -------------------------------------------------
        # Detect MRZ
        # -------------------------------------------------

        mrz_detection = detect_td3_mrz(
            ocr["text"]
        )

        mrz_result = None

        # -------------------------------------------------
        # Parse MRZ if detected
        # -------------------------------------------------

        if mrz_detection["detected"]:

            mrz_result = parse_td3(
                mrz_detection["line1"],
                mrz_detection["line2"],
            )

            # Fill missing fields using MRZ

            if fields.get("name") is None:

                surname = mrz_result.get(
                    "surname",
                    "",
                )

                given_names = mrz_result.get(
                    "givenNames",
                    "",
                )

                full_name = (
                    f"{surname} {given_names}"
                    .strip()
                )

                if full_name:
                    fields["name"] = full_name

            if fields.get("dateOfBirth") is None:

                fields["dateOfBirth"] = (
                    mrz_result.get("dateOfBirth")
                )

            if fields.get("documentNumber") is None:

                fields["documentNumber"] = (
                    mrz_result.get("passportNumber")
                )

            if fields.get("nationality") is None:

                fields["nationality"] = (
                    mrz_result.get("nationality")
                )

            if fields.get("expiryDate") is None:

                fields["expiryDate"] = (
                    mrz_result.get("expiryDate")
                )

        # -------------------------------------------------
        # Document validation
        # -------------------------------------------------

        validation = validate_document(
            fields,
            mrz_result,
        )

        result["ocrResult"] = {
            **ocr,
            "fields": fields,
        }

        result["mrzResult"] = {
            "detected": mrz_detection["detected"],
            "format": mrz_detection["format"],
            "result": mrz_result,
        }

        result["documentValidation"] = validation

        audit_module(
            "DOCUMENT_SCREENING_COMPLETED",
            "OCR, field extraction, MRZ processing, and document validation completed.",
            {
                "ocrCompleted": True,
                "mrzDetected": bool(mrz_detection["detected"]),
                "documentValidationCompleted": True,
            },
        )

        # =================================================
        # 2. Face Verification
        # =================================================

        if live_photo is not None:

            live_path = find_document_path(
                live_photo["documentId"]
            )

            if live_path is not None:

                try:

                    result["faceVerification"] = compare_faces(
                        str(primary_path),
                        str(live_path),
                    )

                except Exception as exc:

                    result["faceVerification"] = {
                        "comparisonCompleted": False,
                        "status": "requires_review",
                        "error": str(exc),
                        "requiresOfficerReview": True,
                    }

                # =================================================
                # 3. Basic Liveness / Image Quality
                # =================================================

                try:

                    result["livenessAnalysis"] = analyze_liveness(
                        str(live_path)
                    )

                except Exception as exc:

                    result["livenessAnalysis"] = {
                        "analysisCompleted": False,
                        "status": "requires_review",
                        "error": str(exc),
                        "requiresOfficerReview": True,
                    }

                audit_module(
                    "FACE_VERIFICATION_COMPLETED",
                    "Face comparison and liveness analysis completed.",
                    {
                        "faceVerificationCompleted": result["faceVerification"] is not None,
                        "livenessCompleted": result["livenessAnalysis"] is not None,
                        "requiresOfficerReview": True,
                    },
                )

        # =================================================
        # 4. Tampering Analysis
        # =================================================

        try:

            result["tamperingAnalysis"] = analyze_tampering(
                str(primary_path)
            )

        except Exception as exc:

            result["tamperingAnalysis"] = {
                "analysisCompleted": False,
                "status": "requires_review",
                "error": str(exc),
                "requiresOfficerReview": True,
            }

        audit_module(
            "TAMPERING_ANALYSIS_COMPLETED",
            "Document tampering analysis completed.",
            {
                "completed": result["tamperingAnalysis"] is not None,
                "requiresOfficerReview": True,
            },
        )

        # =================================================
        # 5. Cross-Document Analysis
        # =================================================

        cross_document_data = {}

        cross_document_data["passport"] = fields

        if visa is not None:
            cross_document_data["visa"] = {}

        if id_card is not None:
            cross_document_data["idCard"] = {}

        if len(cross_document_data) > 1:

            try:

                result["crossDocumentAnalysis"] = (
                    analyze_cross_document(
                        cross_document_data
                    )
                )

            except Exception as exc:

                result["crossDocumentAnalysis"] = {
                    "status": "requires_review",
                    "error": str(exc),
                    "requiresOfficerReview": True,
                }

        else:

            result["crossDocumentAnalysis"] = {
                "status": "insufficient_data",
                "message": (
                    "Additional identity documents are "
                    "required for cross-document comparison."
                ),
                "requiresOfficerReview": True,
            }

        audit_module(
            "CROSS_DOCUMENT_ANALYSIS_COMPLETED",
            "Cross-document comparison stage completed.",
            {
                "status": (
                    result["crossDocumentAnalysis"].get("status")
                    if isinstance(result["crossDocumentAnalysis"], dict)
                    else "completed"
                ),
                "documentsCompared": len(cross_document_data),
            },
        )

        # =================================================
        # 6. Risk Assessment
        # =================================================

        result["riskAssessment"] = assess_risk(
            document_validation=result[
                "documentValidation"
            ],
            face_verification=result[
                "faceVerification"
            ],
            liveness=result[
                "livenessAnalysis"
            ],
            tampering=result[
                "tamperingAnalysis"
            ],
            cross_document=result[
                "crossDocumentAnalysis"
            ],
        )

        # -------------------------------------------------
        # Extract risk summary for cases table
        # -------------------------------------------------

        risk_assessment = (
            result["riskAssessment"]
            or {}
        )

        risk_score = risk_assessment.get(
            "riskScore"
        )

        if risk_score is None:
            risk_score = risk_assessment.get(
                "score"
            )

        risk_level = risk_assessment.get(
            "riskLevel"
        )

        if risk_level is None:
            risk_level = risk_assessment.get(
                "level"
            )

        audit_module(
            "RISK_ASSESSMENT_COMPLETED",
            "Automated risk assessment completed.",
            {
                "riskScore": risk_score,
                "riskLevel": risk_level,
                "requiresOfficerReview": True,
            },
        )

        # =================================================
        # 7. Generate Investigation Report
        # =================================================

        report = build_report(
            document_id=primary_document["documentId"],
            document_validation=result[
                "documentValidation"
            ],
            face_verification=result[
                "faceVerification"
            ],
            liveness=result[
                "livenessAnalysis"
            ],
            tampering=result[
                "tamperingAnalysis"
            ],
            cross_document=result[
                "crossDocumentAnalysis"
            ],
            risk_assessment=result[
                "riskAssessment"
            ],
        )

        result["reportData"] = report

        audit_module(
            "INVESTIGATION_REPORT_GENERATED",
            "Investigation report data generated.",
            {
                "generated": True,
            },
        )

        # =================================================
        # 8. Generate PDF Investigation Report
        # =================================================

        case_information = report.get(
            "caseInformation",
            {},
        )

        case_number = case_information.get(
            "caseId",
            case_id,
        )

        safe_case_number = "".join(
            character
            for character in str(case_number)
            if character.isalnum()
            or character in "-_"
        )

        if not safe_case_number:
            safe_case_number = case_id

        pdf_path = REPORT_DIR / (
            f"{safe_case_number}.pdf"
        )

        create_pdf_report(
            report=report,
            output_path=str(pdf_path),
        )

        result["reportPdf"] = {
            "generated": True,
            "filename": pdf_path.name,
            "path": str(pdf_path),
        }

        audit_module(
            "PDF_REPORT_GENERATED",
            "PDF investigation report generated.",
            {
                "filename": pdf_path.name,
            },
        )

        # -------------------------------------------------
        # Save PDF path to case
        # -------------------------------------------------

        update_case_report_path(
            case_id=case_id,
            report_path=str(pdf_path),
        )

        # =================================================
        # 9. Update Main Case Analysis Summary
        # =================================================

        update_case_analysis_summary(
            case_id=case_id,
            status="completed",
            risk_score=risk_score,
            risk_level=risk_level,
        )

        # =================================================
        # 10. Mark Analysis Completed
        # =================================================

        result["status"] = "completed"

        # =================================================
        # 11. Save All Verification Results
        # =================================================

        update_verification_result(
            case_id=case_id,
            status="completed",

            ocr_result=result[
                "ocrResult"
            ],

            document_validation=result[
                "documentValidation"
            ],

            mrz_result=result[
                "mrzResult"
            ],

            face_verification=result[
                "faceVerification"
            ],

            liveness_analysis=result[
                "livenessAnalysis"
            ],

            tampering_analysis=result[
                "tamperingAnalysis"
            ],

            cross_document_analysis=result[
                "crossDocumentAnalysis"
            ],

            risk_assessment=result[
                "riskAssessment"
            ],

            report_data=result[
                "reportData"
            ],
        )

        # =================================================
        # 12. Create Audit Log
        # =================================================

        create_audit_log(
            case_id=case_id,
            action="CASE_ANALYSIS_COMPLETED",
            actor_type="system",
            description="Automated document and identity analysis completed.",
            metadata={
                "status": "completed",
                "riskScore": risk_score,
                "riskLevel": risk_level,
                "modules": [
                    "ocr",
                    "mrz",
                    "document_validation",
                    "face_verification",
                    "liveness",
                    "tampering",
                    "cross_document",
                    "risk_assessment",
                    "investigation_report",
                    "pdf_report",
                ],
            },
        )

        return result

    # =====================================================
    # Error Handling
    # =====================================================

    except Exception as exc:

        result["status"] = "failed"
        result["errorMessage"] = str(exc)

        # Save failure status
        update_verification_result(
            case_id=case_id,
            status="failed",
            error_message=str(exc),
        )

        # Record failure in audit logs
        create_audit_log(
            case_id=case_id,
            action="CASE_ANALYSIS_FAILED",
            actor_type="system",
            description=(
                "Automated case analysis failed."
            ),
            metadata={
                "error": str(exc),
            },
        )

        raise