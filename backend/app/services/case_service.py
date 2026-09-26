from datetime import datetime, timezone
from uuid import uuid4

from app.db.connection import get_connection
from app.services.audit_log_service import create_audit_log


def generate_case_number() -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"SAT-{timestamp}"


def create_case(
    document_id: str | None = None,
    risk_score: int | None = None,
    risk_level: str | None = None,
):
    case_id = str(uuid4())
    case_number = generate_case_number()

    query = """
        INSERT INTO cases (
            id,
            case_number,
            status,
            document_id,
            risk_score,
            risk_level,
            review_status,
            created_at,
            updated_at
        )
        VALUES (
            %s, %s, %s, %s, %s, %s, %s,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        RETURNING
            id,
            case_number,
            status,
            document_id,
            risk_score,
            risk_level,
            review_status,
            officer_decision,
            officer_remarks,
            report_path,
            created_at,
            updated_at;
    """

    values = (
        case_id,
        case_number,
        "pending",
        document_id,
        risk_score,
        risk_level,
        "pending",
    )

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, values)
            row = cursor.fetchone()
        connection.commit()

    create_audit_log(
        case_id=case_id,
        action="CASE_CREATED",
        actor_type="system",
        description="New case created.",
        metadata={
            "caseNumber": case_number,
            "documentId": document_id,
        },
    )

    return row


def get_case(case_id: str):
    query = """
        SELECT
            id,
            case_number,
            status,
            document_id,
            risk_score,
            risk_level,
            review_status,
            officer_decision,
            officer_remarks,
            report_path,
            created_at,
            updated_at
        FROM cases
        WHERE id = %s;
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, (case_id,))
            row = cursor.fetchone()

    return row


def get_all_cases():
    query = """
        SELECT
            id,
            case_number,
            status,
            document_id,
            risk_score,
            risk_level,
            review_status,
            officer_decision,
            officer_remarks,
            report_path,
            created_at,
            updated_at
        FROM cases
        ORDER BY created_at DESC;
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()

    return rows


def update_case_review(
    case_id: str,
    review_status: str,
    officer_decision: str | None = None,
    officer_remarks: str | None = None,
):
    allowed_review_statuses = {
        "pending",
        "in_review",
        "completed",
    }

    if review_status not in allowed_review_statuses:
        raise ValueError(
            f"Invalid review status: {review_status}. "
            f"Allowed values: {sorted(allowed_review_statuses)}"
        )

    allowed_decisions = {
        "approved",
        "escalated",
        "rejected",
    }

    if officer_decision is not None and officer_decision not in allowed_decisions:
        raise ValueError(
            f"Invalid officer decision: {officer_decision}. "
            "Allowed values: approved, escalated, rejected."
        )

    if review_status == "completed" and not officer_decision:
        raise ValueError(
            "An officer decision is required before completing the review."
        )

    # The case is finalized only after an authorised officer
    # completes the review with an explicit decision.
    query = """
        UPDATE cases
        SET
            status = CASE
                WHEN %s = 'completed' AND %s IS NOT NULL
                    THEN 'completed'
                ELSE status
            END,
            review_status = %s,
            officer_decision = %s,
            officer_remarks = %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        RETURNING
            id,
            case_number,
            status,
            document_id,
            risk_score,
            risk_level,
            review_status,
            officer_decision,
            officer_remarks,
            report_path,
            created_at,
            updated_at;
    """

    values = (
        review_status,
        officer_decision,
        review_status,
        officer_decision,
        officer_remarks,
        case_id,
    )

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, values)
            row = cursor.fetchone()
        connection.commit()

    if row:
        create_audit_log(
            case_id=case_id,
            action=(
                "CASE_COMPLETED"
                if review_status == "completed"
                else "OFFICER_REVIEW_UPDATED"
            ),
            actor_type="officer",
            description=(
                "Officer completed the case review and recorded a decision."
                if review_status == "completed"
                else "Officer review was updated."
            ),
            metadata={
                "reviewStatus": review_status,
                "officerDecision": officer_decision,
                "hasRemarks": bool(officer_remarks),
            },
        )

    return row


def update_case_report_path(
    case_id: str,
    report_path: str,
):
    query = """
        UPDATE cases
        SET
            report_path = %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        RETURNING
            id,
            case_number,
            status,
            document_id,
            risk_score,
            risk_level,
            review_status,
            officer_decision,
            officer_remarks,
            report_path,
            created_at,
            updated_at;
    """

    values = (
        report_path,
        case_id,
    )

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, values)
            row = cursor.fetchone()
        connection.commit()

    if row:
        create_audit_log(
            case_id=case_id,
            action="REPORT_PATH_UPDATED",
            actor_type="system",
            description="Case report path was updated.",
            metadata={
                "reportPath": report_path,
            },
        )

    return row


def update_case_analysis_summary(
    case_id: str,
    status: str,
    risk_score: int | None,
    risk_level: str | None,
):
    # Automated analysis completion does not finalize the case.
    # Officer review remains the final workflow step.
    query = """
        UPDATE cases
        SET
            status = %s,
            risk_score = %s,
            risk_level = %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        RETURNING
            id,
            case_number,
            status,
            document_id,
            risk_score,
            risk_level,
            review_status,
            officer_decision,
            officer_remarks,
            report_path,
            created_at,
            updated_at;
    """

    values = (
        status,
        risk_score,
        risk_level,
        case_id,
    )

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, values)
            row = cursor.fetchone()
        connection.commit()

    if row:
        create_audit_log(
            case_id=case_id,
            action="SCREENING_COMPLETED",
            actor_type="system",
            description="Automated case screening completed.",
            metadata={
                "status": status,
                "riskScore": risk_score,
                "riskLevel": risk_level,
            },
        )

    return row