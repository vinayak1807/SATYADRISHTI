from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.audit_log_service import (
    create_audit_log,
    get_case_audit_logs,
)
from app.services.case_service import get_case

router = APIRouter(
    prefix="/api/audit-logs",
    tags=["Audit Logs"],
)


class CreateAuditLogRequest(BaseModel):
    caseId: Optional[str] = None
    action: str
    actorType: str = "system"
    actorId: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[dict] = None


def audit_log_to_dict(row):
    if not row:
        return None

    return {
        "id": str(row[0]),
        "caseId": str(row[1]) if row[1] is not None else None,
        "action": row[2],
        "actorType": row[3],
        "actorId": row[4],
        "description": row[5],
        "metadata": row[6],
        "createdAt": row[7].isoformat() if row[7] is not None else None,
    }


@router.post("")
async def create_new_audit_log(request: CreateAuditLogRequest):
    try:
        if request.caseId:
            case = get_case(request.caseId)

            if not case:
                raise HTTPException(
                    status_code=404,
                    detail="Case not found.",
                )

        log = create_audit_log(
            case_id=request.caseId,
            action=request.action,
            actor_type=request.actorType,
            actor_id=request.actorId,
            description=request.description,
            metadata=request.metadata,
        )

        return {
            "success": True,
            "auditLog": audit_log_to_dict(log),
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Audit log creation failed: {str(e)}",
        )


@router.get("/case/{case_id}")
async def get_case_logs(case_id: str):
    try:
        case = get_case(case_id)

        if not case:
            raise HTTPException(
                status_code=404,
                detail="Case not found.",
            )

        logs = get_case_audit_logs(case_id)

        return {
            "success": True,
            "caseId": case_id,
            "count": len(logs),
            "auditLogs": [
                audit_log_to_dict(log)
                for log in logs
            ],
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve audit logs: {str(e)}",
        )