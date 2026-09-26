from datetime import datetime
from typing import Optional


def normalize_text(value: Optional[str]) -> Optional[str]:
    if not value:
        return None

    return (
        value.upper()
        .replace("<", " ")
        .replace(",", " ")
        .strip()
    )


def normalize_date(value: Optional[str]) -> Optional[str]:
    if not value:
        return None

    value = value.strip()

    # MRZ format: YYMMDD
    if len(value) == 6 and value.isdigit():
        try:
            date = datetime.strptime(value, "%y%m%d")
            return date.strftime("%Y-%m-%d")
        except ValueError:
            return None

    # Common OCR formats
    for fmt in (
        "%d.%m.%Y",
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%Y-%m-%d",
    ):
        try:
            date = datetime.strptime(value, fmt)
            return date.strftime("%Y-%m-%d")
        except ValueError:
            continue

    return None


def compare_values(
    field: str,
    ocr_value: Optional[str],
    mrz_value: Optional[str],
):
    if not ocr_value and not mrz_value:
        return {
            "field": field,
            "ocrValue": None,
            "mrzValue": None,
            "status": "missing",
        }

    if not ocr_value:
        return {
            "field": field,
            "ocrValue": None,
            "mrzValue": mrz_value,
            "status": "ocr_missing",
        }

    if not mrz_value:
        return {
            "field": field,
            "ocrValue": ocr_value,
            "mrzValue": None,
            "status": "mrz_missing",
        }

    if field in {"dateOfBirth", "expiryDate"}:
        normalized_ocr = normalize_date(ocr_value)
        normalized_mrz = normalize_date(mrz_value)

        if (
            normalized_ocr
            and normalized_mrz
            and normalized_ocr == normalized_mrz
        ):
            status = "match"

        elif normalized_ocr and normalized_mrz:
            status = "mismatch"

        else:
            status = "unable_to_compare"

    else:
        normalized_ocr = normalize_text(ocr_value)
        normalized_mrz = normalize_text(mrz_value)

        if normalized_ocr == normalized_mrz:
            status = "match"
        else:
            status = "mismatch"

    return {
        "field": field,
        "ocrValue": ocr_value,
        "mrzValue": mrz_value,
        "status": status,
    }


def validate_expiry(expiry_date: Optional[str]):
    if not expiry_date:
        return {
            "status": "unknown",
            "message": "Expiry date is unavailable.",
        }

    normalized = normalize_date(expiry_date)

    if not normalized:
        return {
            "status": "unknown",
            "message": "Expiry date could not be interpreted.",
        }

    try:
        expiry = datetime.strptime(
            normalized,
            "%Y-%m-%d",
        ).date()

        today = datetime.now().date()

        if expiry < today:
            return {
                "status": "expired",
                "message": "Document expiry date has passed.",
            }

        return {
            "status": "valid",
            "message": "Document expiry date has not passed.",
        }

    except ValueError:
        return {
            "status": "unknown",
            "message": "Invalid expiry date.",
        }


def validate_document(
    ocr_fields: dict,
    mrz_result: Optional[dict],
):
    if not mrz_result:
        return {
            "mrzAvailable": False,
            "fieldComparisons": [],
            "expiry": {
                "status": "unknown",
                "message": "MRZ data is unavailable.",
            },
            "overallStatus": "insufficient_data",
        }

    comparisons = [
        compare_values(
            "name",
            ocr_fields.get("name"),
            (
                f"{mrz_result.get('surname', '')} "
                f"{mrz_result.get('givenNames', '')}"
            ).strip(),
        ),
        compare_values(
            "dateOfBirth",
            ocr_fields.get("dateOfBirth"),
            mrz_result.get("dateOfBirth"),
        ),
        compare_values(
            "documentNumber",
            ocr_fields.get("documentNumber"),
            mrz_result.get("passportNumber"),
        ),
        compare_values(
            "nationality",
            ocr_fields.get("nationality"),
            mrz_result.get("nationality"),
        ),
        compare_values(
            "expiryDate",
            ocr_fields.get("expiryDate"),
            mrz_result.get("expiryDate"),
        ),
    ]

    expiry = validate_expiry(
        mrz_result.get("expiryDate")
    )

    statuses = [
        item["status"]
        for item in comparisons
    ]

    if "mismatch" in statuses:
        overall_status = "mismatch"

    elif expiry["status"] == "expired":
        overall_status = "expired"

    elif mrz_result.get("allChecksValid") is False:
        overall_status = "mrz_check_failed"

    elif all(
        status in {
            "match",
            "ocr_missing",
            "mrz_missing",
        }
        for status in statuses
    ):
        overall_status = "consistent"

    else:
        overall_status = "review"

    return {
        "mrzAvailable": True,
        "fieldComparisons": comparisons,
        "expiry": expiry,
        "mrzChecks": mrz_result.get(
            "checks",
            {},
        ),
        "allMrzChecksValid": mrz_result.get(
            "allChecksValid"
        ),
        "overallStatus": overall_status,
    }