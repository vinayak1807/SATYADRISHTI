from datetime import datetime, timezone
from typing import Optional


def generate_case_id() -> str:
    timestamp = datetime.now(
        timezone.utc
    ).strftime("%Y%m%d%H%M%S")

    return f"SAT-{timestamp}"


def build_report(
    document_id: str,
    document_validation: Optional[dict] = None,
    face_verification: Optional[dict] = None,
    liveness: Optional[dict] = None,
    tampering: Optional[dict] = None,
    cross_document: Optional[dict] = None,
    risk_assessment: Optional[dict] = None,
) -> dict:

    document_validation = (
        document_validation or {}
    )

    face_verification = (
        face_verification or {}
    )

    liveness = (
        liveness or {}
    )

    tampering = (
        tampering or {}
    )

    cross_document = (
        cross_document or {}
    )

    risk_assessment = (
        risk_assessment or {}
    )

    case_id = generate_case_id()

    risk_factors = risk_assessment.get(
        "riskFactors",
        []
    )

    return {
        "reportGenerated": True,

        "caseInformation": {
            "caseId": case_id,
            "documentId": document_id,
            "generatedAt": datetime.now(
                timezone.utc
            ).isoformat(),
            "system": "Satyadristi",
        },

        "documentAnalysis": {
            "validation": document_validation,
        },

        "biometricAnalysis": {
            "faceVerification": face_verification,
            "liveness": liveness,
        },

        "documentIntegrity": {
            "tampering": tampering,
        },

        "crossDocumentAnalysis": {
            "result": cross_document,
        },

        "riskAssessment": {
            "score": risk_assessment.get(
                "riskScore"
            ),
            "level": risk_assessment.get(
                "riskLevel"
            ),
            "factors": risk_factors,
        },

        "investigationSummary": {
            "reviewRequired": True,
            "riskFactorCount": len(
                risk_factors
            ),
            "documentStatus": document_validation.get(
                "overallStatus"
            ),
            "crossDocumentStatus": cross_document.get(
                "overallStatus"
            ),
            "faceVerificationCompleted": (
                face_verification.get(
                    "comparisonCompleted",
                    False,
                )
            ),
            "livenessAnalysisCompleted": (
                liveness.get(
                    "analysisCompleted",
                    False,
                )
            ),
            "tamperingAnalysisCompleted": (
                tampering.get(
                    "analysisCompleted",
                    False,
                )
            ),
        },

        "officerReview": {
            "status": "pending",
            "decision": None,
            "remarks": None,
        },

        "disclaimer": (
            "This report contains automated analysis "
            "signals intended to support authorized "
            "officer review. Automated results should "
            "not be treated as definitive proof of "
            "identity, fraud, or immigration eligibility."
        ),
    }