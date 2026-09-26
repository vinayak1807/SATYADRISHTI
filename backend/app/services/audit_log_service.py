import json
from datetime import datetime, timezone
from uuid import uuid4

from app.db.connection import get_connection


def create_audit_log(
    case_id: str | None,
    action: str,
    actor_type: str = "system",
    actor_id: str | None = None,
    description: str | None = None,
    metadata: dict | None = None,
):
    query = """
        INSERT INTO audit_logs (
            id,
            case_id,
            action,
            actor_type,
            actor_id,
            description,
            metadata,
            created_at
        )
        VALUES (
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s
        )
        RETURNING
            id,
            case_id,
            action,
            actor_type,
            actor_id,
            description,
            metadata,
            created_at;
    """

    values = (
        str(uuid4()),
        case_id,
        action,
        actor_type,
        actor_id,
        description,
        json.dumps(metadata or {}),
        datetime.now(timezone.utc),
    )

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, values)
            row = cursor.fetchone()

        connection.commit()

    return row


def get_case_audit_logs(case_id: str):
    query = """
        SELECT
            id,
            case_id,
            action,
            actor_type,
            actor_id,
            description,
            metadata,
            created_at
        FROM audit_logs
        WHERE case_id = %s
        ORDER BY created_at DESC;
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, (case_id,))
            rows = cursor.fetchall()

    return rows