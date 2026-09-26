import re
from typing import Optional


def find_value(text: str, patterns: list[str]) -> Optional[str]:
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)

        if match:
            return match.group(1).strip()

    return None


def extract_fields(full_text: str):
    text = full_text.replace("\r", "\n")

    name = find_value(
        text,
        [
            r"(?:name|full name)\s*[:\-]?\s*([A-Za-z][A-Za-z .'-]+)",
        ],
    )

    date_of_birth = find_value(
        text,
        [
            r"(?:date of birth|dob|birth date)\s*[:\-]?\s*([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{2,4})",
        ],
    )

    document_number = find_value(
        text,
        [
            r"(?:document number|passport number|passport no|id number)\s*[:\-]?\s*([A-Z0-9\-]+)",
        ],
    )

    nationality = find_value(
        text,
        [
            r"(?:nationality)\s*[:\-]?\s*([A-Za-z ]+)",
        ],
    )

    expiry_date = find_value(
        text,
        [
            r"(?:expiry date|expiration date|date of expiry)\s*[:\-]?\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})",
        ],
    )

    return {
        "name": name,
        "dateOfBirth": date_of_birth,
        "documentNumber": document_number,
        "nationality": nationality,
        "expiryDate": expiry_date,
    }