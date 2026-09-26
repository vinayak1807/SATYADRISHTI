from typing import Any, Optional


def clamp_score(score: int) -> int:
    return max(0, min(100, score))


def add_factor(
    factors: list,
    category: str,
    severity: str,
    points: int,
    message: str,
):
    factors.append(
        {
            "category": category,
            "severity": severity,
            "points": points,
            "message": message,
        }
    )


def get_status(
    score: int,
) -> str:
    if score >= 70:
        return "high"

    if score >= 40:
        return "medium"

    return "low"


def assess_risk(
    document_validation: Optional[dict] = None,
    face_verification: Optional[dict] = None,
    liveness: Optional[dict] = None,
    tampering: Optional[dict] = None,
    cross_document: Optional[dict] = None,
) -> dict:

    document_validation = document_validation or {}
    face_verification = face_verification or {}
    liveness = liveness or {}
    tampering = tampering or {}
    cross_document = cross_document or {}

    score = 0
    factors = []

    # --------------------------------------------------
    # DOCUMENT VALIDATION
    # --------------------------------------------------

    document_status = document_validation.get(
        "overallStatus"
    )

    if document_status == "mismatch":

        add_factor(
            factors,
            "document_validation",
            "high",
            30,
            "One or more document fields do not match MRZ data.",
        )

    elif document_status == "expired":

        add_factor(
            factors,
            "document_validation",
            "medium",
            20,
            "The document expiry date has passed.",
        )

    elif document_status == "mrz_check_failed":

        add_factor(
            factors,
            "document_validation",
            "medium",
            20,
            "One or more required MRZ validation checks failed.",
        )

    elif document_status == "insufficient_data":

        add_factor(
            factors,
            "document_validation",
            "low",
            5,
            "Insufficient document data was available for complete validation.",
        )

    # --------------------------------------------------
    # FACE VERIFICATION
    # --------------------------------------------------

    similarity = face_verification.get(
        "similarity"
    )

    if isinstance(similarity, (int, float)):

        # This is deliberately NOT an identity decision.
        # It only identifies an unusually low similarity
        # signal for officer review.
        if similarity < 0.40:

            add_factor(
                factors,
                "face_verification",
                "high",
                30,
                "Face comparison produced a low similarity signal.",
            )

        elif similarity < 0.60:

            add_factor(
                factors,
                "face_verification",
                "medium",
                15,
                "Face comparison produced an intermediate similarity signal.",
            )

    else:

        add_factor(
            factors,
            "face_verification",
            "low",
            5,
            "Face verification data was unavailable.",
        )

    # --------------------------------------------------
    # LIVENESS
    # --------------------------------------------------

    liveness_result = liveness.get(
        "livenessAssessment",
        {}
    )

    liveness_status = liveness_result.get(
        "status"
    )

    if liveness_status == "requires_review":

        add_factor(
            factors,
            "liveness",
            "low",
            5,
            "Liveness requires additional verification.",
        )

    # --------------------------------------------------
    # TAMPERING
    # --------------------------------------------------

    tampering_result = tampering.get(
        "tamperingAssessment",
        {}
    )

    indicators = tampering_result.get(
        "indicators",
        []
    )

    if indicators:

        meaningful_indicators = [
            indicator
            for indicator in indicators
            if indicator
            and "no basic image-quality anomaly"
            not in indicator.lower()
        ]

        if meaningful_indicators:

            add_factor(
                factors,
                "tampering",
                "medium",
                20,
                "Image analysis produced one or more document-quality indicators requiring review.",
            )

    # --------------------------------------------------
    # CROSS-DOCUMENT
    # --------------------------------------------------

    cross_status = cross_document.get(
        "overallStatus"
    )

    if cross_status == "mismatch":

        add_factor(
            factors,
            "cross_document",
            "high",
            30,
            "One or more identity fields differ across supplied documents.",
        )

    elif cross_status == "insufficient_data":

        add_factor(
            factors,
            "cross_document",
            "low",
            5,
            "There was insufficient information to compare the supplied documents.",
        )

    # --------------------------------------------------
    # FINAL SCORE
    # --------------------------------------------------

    score = clamp_score(
        sum(
            factor["points"]
            for factor in factors
        )
    )

    status = get_status(score)

    return {
        "analysisCompleted": True,

        "riskScore": score,

        "riskLevel": status,

        "riskFactors": factors,

        "factorCount": len(factors),

        "requiresOfficerReview": True,

        "decisionNote": (
            "This assessment is a decision-support signal "
            "based on available verification results. "
            "It must not be treated as a definitive "
            "identity, fraud, or immigration decision."
        ),
    }