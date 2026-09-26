import re


def normalize_mrz_line(line: str) -> str:
    """
    Normalize OCR output for MRZ processing.
    MRZ uses A-Z, 0-9 and <.
    """
    line = line.upper().strip()

    replacements = {
        " ": "",
        "«": "<",
        "‹": "<",
        "﹤": "<",
    }

    for old, new in replacements.items():
        line = line.replace(old, new)

    return re.sub(r"[^A-Z0-9<]", "", line)


def calculate_check_digit(value: str) -> str:
    """
    ICAO 9303 check digit calculation.

    Character values:
    0-9 = their numeric value
    A-Z = 10-35
    <   = 0

    Weights repeat: 7, 3, 1
    """
    weights = [7, 3, 1]
    total = 0

    for index, char in enumerate(value):
        if char == "<":
            value_num = 0
        elif char.isdigit():
            value_num = int(char)
        elif "A" <= char <= "Z":
            value_num = ord(char) - ord("A") + 10
        else:
            value_num = 0

        total += value_num * weights[index % 3]

    return str(total % 10)


def validate_check_digit(value: str, expected: str) -> bool:
    if not expected.isdigit():
        return False

    return calculate_check_digit(value) == expected


def parse_td3(line1: str, line2: str):
    """
    Parse a TD3 passport MRZ.

    TD3:
    Line 1 = 44 characters
    Line 2 = 44 characters
    """

    line1 = normalize_mrz_line(line1)
    line2 = normalize_mrz_line(line2)

    if len(line1) != 44 or len(line2) != 44:
        return {
            "validStructure": False,
            "error": "TD3 MRZ must contain two lines of 44 characters.",
        }

    document_type = line1[0]
    issuing_country = line1[2:5]

    name_section = line1[5:]
    name_parts = name_section.split("<<", 1)

    surname = name_parts[0].replace("<", " ").strip()

    given_names = ""

    if len(name_parts) > 1:
        given_names = name_parts[1].replace("<", " ").strip()

    passport_number = line2[0:9]
    passport_number_check = line2[9]

    nationality = line2[10:13]

    date_of_birth = line2[13:19]
    date_of_birth_check = line2[19]

    sex = line2[20]

    expiry_date = line2[21:27]
    expiry_date_check = line2[27]

    personal_number = line2[28:42]
    personal_number_check = line2[42]

    composite_check = line2[43]

    passport_valid = validate_check_digit(
        passport_number,
        passport_number_check,
    )

    dob_valid = validate_check_digit(
        date_of_birth,
        date_of_birth_check,
    )

    expiry_valid = validate_check_digit(
        expiry_date,
        expiry_date_check,
    )

    if personal_number.replace("<", "") == "":
     personal_valid = None
    else:
     personal_valid = validate_check_digit(
        personal_number,
        personal_number_check,
      )

    composite_data = (
        line2[0:10]
        + line2[13:20]
        + line2[21:43]
    )

    composite_valid = validate_check_digit(
        composite_data,
        composite_check,
    )

    return {
        "validStructure": True,
        "documentType": document_type,
        "issuingCountry": issuing_country,
        "surname": surname,
        "givenNames": given_names,
        "passportNumber": passport_number.replace("<", ""),
        "nationality": nationality,
        "dateOfBirth": date_of_birth,
        "sex": sex,
        "expiryDate": expiry_date,
        "personalNumber": personal_number.replace("<", ""),
        "checks": {
            "passportNumber": passport_valid,
            "dateOfBirth": dob_valid,
            "expiryDate": expiry_valid,
            "personalNumber": personal_valid,
            "composite": composite_valid,
        },
      "allChecksValid": all(
    check
    for check in [
        passport_valid,
        dob_valid,
        expiry_valid,
        composite_valid,
    ]
),
    }