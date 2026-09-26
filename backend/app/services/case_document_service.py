from datetime import datetime, timezone
from uuid import uuid4

from app.db.connection import get_connection


def add_case_document(
    case_id: str,
    document_id: str,
    document_type: str,
    original_filename: str | None = None,
    file_path: str | None = None,
):
    document_record_id = str(uuid4())

    query = """
        INSERT INTO case_documents (
            id,
            case_id,
            document_id,
            document_type,
            original_filename,
            file_path,
            created_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
        RETURNING
            id,
            case_id,
            document_id,
            document_type,
            original_filename,
            file_path,
            created_at;
    """

    values = (
        document_record_id,
        case_id,
        document_id,
        document_type,
        original_filename,
        file_path,
    )

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, values)
            row = cursor.fetchone()

        connection.commit()

    return row


def get_case_documents(case_id: str):
    query = """
        SELECT
            id,
            case_id,
            document_id,
            document_type,
            original_filename,
            file_path,
            created_at
        FROM case_documents
        WHERE case_id = %s
        ORDER BY created_at ASC;
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, (case_id,))
            rows = cursor.fetchall()

    return rows


def delete_case_document(case_document_id: str):
    query = """
        DELETE FROM case_documents
        WHERE id = %s
        RETURNING id;
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, (case_document_id,))
            row = cursor.fetchone()

        connection.commit()

    return row
