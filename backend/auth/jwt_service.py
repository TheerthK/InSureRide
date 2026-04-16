"""
InSureRide — JWT Token Service
Issues and validates access + refresh tokens using python-jose (HS256).
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt

from config import (
    SECRET_KEY,
    JWT_ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
)


def create_access_token(rider_id: int) -> str:
    """Create a short-lived access token (1 hour)."""
    payload = {
        "sub": str(rider_id),
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def create_refresh_token(rider_id: int) -> str:
    """Create a long-lived refresh token (30 days)."""
    payload = {
        "sub": str(rider_id),
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def verify_token(token: str, expected_type: str = "access") -> Optional[int]:
    """
    Decode and validate a JWT token.

    Returns:
        rider_id (int) if valid, None otherwise.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != expected_type:
            return None
        rider_id = payload.get("sub")
        if rider_id is None:
            return None
        return int(rider_id)
    except (JWTError, ValueError):
        return None


def get_current_rider_id(token: str) -> Optional[int]:
    """Convenience wrapper — extracts rider_id from an access token."""
    return verify_token(token, expected_type="access")
