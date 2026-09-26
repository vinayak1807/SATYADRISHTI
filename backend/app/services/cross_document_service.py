from typing import Optional


def normalize_text(value: Optional[str]) -> Optional[str]:
    if not value:
        return None

    return (
        value
        .upper()
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
        return value

    # Common OCR formats
    for separator in [".", "/", "-"]:
        parts = value.split(separator)

        if len(parts) == 3:
            day, month, year = parts

            if len(year) == 4:
                return f"{year}-{month.zfill(2)}-{day.zfill(2)}"

    return value


def compare_field(
    field_name: str,
    values: dict,
):
    available_values = {
        document_type: value
        for document_type, value in values.items()
        if value not in [None, ""]
    }

    if len(available_values) < 2:
        return {
            "field": field_name,
            "status": "insufficient_data",
            "values": available_values,
        }

    normalized_values = {}

    for document_type, value in available_values.items():

        if field_name in {
            "name",
            "nationality",
        }:
            normalized_values[document_type] = normalize_text(
                value
            )

        elif field_name == "dateOfBirth":
            normalized_values[document_type] = normalize_date(
                value
            )

        else:
            normalized_values[document_type] = normalize_text(
                value
            )

    unique_values = set(
        normalized_values.values()
    )

    if len(unique_values) == 1:
        status = "match"
    else:
        status = "mismatch"

    return {
        "field": field_name,
        "status": status,
        "values": available_values,
        "normalizedValues": normalized_values,
    }


def analyze_cross_document(
    documents: dict,
):
    """
    Expected structure:

    {
        "passport": {
            "name": "...",
            "dateOfBirth": "...",
            "nationality": "...",
            "documentNumber": "..."
        },
        "visa": {
            "name": "...",
            "dateOfBirth": "...",
            "nationality": "..."
        },
        "idCard": {
            "name": "...",
            "dateOfBirth": "...",
            "nationality": "..."
        }
    }
    """

    comparisons = []

    fields = [
        "name",
        "dateOfBirth",
        "nationality",
    ]

    for field in fields:

        field_values = {}

        for document_type, document_data in documents.items():

            if not isinstance(document_data, dict):
                continue

            field_values[document_type] = document_data.get(
                field
            )

        comparison = compare_field(
            field,
            field_values,
        )

        comparisons.append(
            comparison
        )

    mismatch_fields = [
        item["field"]
        for item in comparisons
        if item["status"] == "mismatch"
    ]

    matched_fields = [
        item["field"]
        for item in comparisons
        if item["status"] == "match"
    ]

    insufficient_fields = [
        item["field"]
        for item in comparisons
        if item["status"] == "insufficient_data"
    ]

    if mismatch_fields:
        overall_status = "mismatch"

    elif matched_fields:
        overall_status = "consistent"

    else:
        overall_status = "insufficient_data"

    return {
        "analysisCompleted": True,
        "overallStatus": overall_status,
        "comparisons": comparisons,
        "summary": {
            "matchedFields": matched_fields,
            "mismatchFields": mismatch_fields,
            "insufficientFields": insufficient_fields,
        },
        "requiresOfficerReview": True,
    }