from app.services.mrz_service import normalize_mrz_line


def detect_td3_mrz(text_lines: list[str]):
    """
    Look for two consecutive OCR lines that resemble
    a TD3 passport MRZ.
    """

    normalized_lines = [
        normalize_mrz_line(line)
        for line in text_lines
    ]

    for i in range(len(normalized_lines) - 1):
        line1 = normalized_lines[i]
        line2 = normalized_lines[i + 1]

        if (
            len(line1) == 44
            and len(line2) == 44
            and line1.startswith("P<")
        ):
            return {
                "detected": True,
                "format": "TD3",
                "line1": line1,
                "line2": line2,
            }

    return {
        "detected": False,
        "format": None,
        "line1": None,
        "line2": None,
    }