"""
InSureRide — Audit Log Decorator
Logs every important action to the audit_log table with:
- actor type + id
- action name
- SHA-256 hash of the payload
- human-readable summary
"""
import hashlib
import json
import functools
from datetime import datetime

from sqlalchemy.orm import Session

from models import AuditLog


def _hash_payload(payload: dict) -> str:
    """SHA-256 hash of the JSON-serialised payload."""
    raw = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(raw.encode()).hexdigest()


def write_audit(
    db: Session,
    actor_type: str,
    actor_id: str,
    action: str,
    payload: dict | None = None,
    summary: str = "",
):
    """Write a single audit log entry."""
    entry = AuditLog(
        actor_type=actor_type,
        actor_id=str(actor_id),
        action=action,
        payload_hash=_hash_payload(payload) if payload else None,
        payload_summary=summary or json.dumps(payload, default=str)[:500] if payload else "",
        timestamp=datetime.utcnow(),
    )
    db.add(entry)
    db.commit()


def audit(action_name: str, actor_type: str = "SYSTEM"):
    """
    Decorator for route handlers.

    Usage:
        @audit("otp_requested", actor_type="RIDER")
        def request_otp(...):
            ...

    The decorated function MUST accept `db: Session` as a keyword param
    (which FastAPI Depends already provides).
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)

            # Try to extract db session from kwargs
            db: Session | None = kwargs.get("db")
            if db is not None:
                # Build a minimal payload from kwargs (skip db itself)
                payload = {
                    k: v for k, v in kwargs.items()
                    if k != "db" and not hasattr(v, "__dict__")
                }
                # Try to figure out actor_id from common patterns
                actor_id = (
                    kwargs.get("rider_id")
                    or kwargs.get("claim_id")
                    or "unknown"
                )
                try:
                    write_audit(
                        db=db,
                        actor_type=actor_type,
                        actor_id=str(actor_id),
                        action=action_name,
                        payload=payload,
                    )
                except Exception:
                    pass  # Audit must never break the main flow
            return result
        return wrapper
    return decorator
