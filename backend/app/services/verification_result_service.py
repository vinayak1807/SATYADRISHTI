from uuid import uuid4

from psycopg.types.json import Jsonb

from app.db.connection import get_connection


def create_verification_result(case_id: str):
    result_id = str(uuid4())

    query = """
        INSERT INTO verification_results (
            id,
            case_id,
            status,
            created_at,
            updated_at
        )
        VALUES (
            %s,
            %s,
            %s,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        RETURNING
            id,
            case_id,
            status,
            ocr_result,
            document_validation,
            mrz_result,
            face_verification,
            liveness_analysis,
            tampering_analysis,
            cross_document_analysis,
            risk_assessment,
            report_data,
            error_message,
            created_at,
            updated_at;
    """

    values = (
        result_id,
        case_id,
        "pending",
    )

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, values)
            row = cursor.fetchone()

        connection.commit()

    return row


def update_verification_result(
    case_id: str,
    status: str | None = None,
    ocr_result: dict | None = None,
    document_validation: dict | None = None,
    mrz_result: dict | None = None,
    face_verification: dict | None = None,
    liveness_analysis: dict | None = None,
    tampering_analysis: dict | None = None,
    cross_document_analysis: dict | None = None,
    risk_assessment: dict | None = None,
    report_data: dict | None = None,
    error_message: str | None = None,
):
    query = """
        UPDATE verification_results
        SET
            status = COALESCE(%s, status),

            ocr_result = COALESCE(%s, ocr_result),
            document_validation = COALESCE(%s, document_validation),
            mrz_result = COALESCE(%s, mrz_result),

            face_verification = COALESCE(%s, face_verification),
            liveness_analysis = COALESCE(%s, liveness_analysis),

            tampering_analysis = COALESCE(%s, tampering_analysis),
            cross_document_analysis = COALESCE(%s, cross_document_analysis),

            risk_assessment = COALESCE(%s, risk_assessment),

            report_data = COALESCE(%s, report_data),

            error_message = COALESCE(%s, error_message),

            updated_at = CURRENT_TIMESTAMP

        WHERE case_id = %s

        RETURNING
            id,
            case_id,
            status,
            ocr_result,
            document_validation,
            mrz_result,
            face_verification,
            liveness_analysis,
            tampering_analysis,
            cross_document_analysis,
            risk_assessment,
            report_data,
            error_message,
            created_at,
            updated_at;
    """

    values = (
        status,

        Jsonb(ocr_result) if ocr_result is not None else None,
        Jsonb(document_validation) if document_validation is not None else None,
        Jsonb(mrz_result) if mrz_result is not None else None,

        Jsonb(face_verification) if face_verification is not None else None,
        Jsonb(liveness_analysis) if liveness_analysis is not None else None,

        Jsonb(tampering_analysis) if tampering_analysis is not None else None,
        Jsonb(cross_document_analysis)
        if cross_document_analysis is not None
        else None,

        Jsonb(risk_assessment) if risk_assessment is not None else None,

        Jsonb(report_data) if report_data is not None else None,

        error_message,

        case_id,
    )

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, values)
            row = cursor.fetchone()

        connection.commit()

    return row


def get_verification_result(case_id: str):
    query = """
        SELECT
            id,
            case_id,
            status,
            ocr_result,
            document_validation,
            mrz_result,
            face_verification,
            liveness_analysis,
            tampering_analysis,
            cross_document_analysis,
            risk_assessment,
            report_data,
            error_message,
            created_at,
            updated_at
        FROM verification_results
        WHERE case_id = %s;
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, (case_id,))
            row = cursor.fetchone()

    return row