"""
InSureRide — OTP Service
In-memory OTP store with 5-minute TTL.
Demo mode: accepts any 6-digit OTP.
Production flow documented but not enforced in demo.
"""
import uuid
import random
import time
from typing import Optional

from config import OTP_TTL_SECONDS, DEMO_MODE

# ── In-memory store ──────────────────────────────────────────────────────────
# Structure: {request_id: {"phone": str, "otp": str, "expires_at": float}}
_otp_store: dict[str, dict] = {}


def _cleanup_expired():
    """Remove expired OTPs on each call to prevent unbounded growth."""
    now = time.time()
    expired = [k for k, v in _otp_store.items() if v["expires_at"] < now]
    for k in expired:
        del _otp_store[k]


def request_otp(phone: str) -> str:
    """
    Generate a 6-digit OTP for the given phone number.

    Returns:
        request_id — caller uses this to verify later.

    In production this would dispatch the OTP via Twilio SMS.
    In demo mode we just print it to the console.
    """
    _cleanup_expired()

    request_id = uuid.uuid4().hex[:16]
    otp = f"{random.randint(0, 999999):06d}"

    _otp_store[request_id] = {
        "phone": phone,
        "otp": otp,
        "expires_at": time.time() + OTP_TTL_SECONDS,
    }

    # In production: send via Twilio/MSG91
    # In demo: log to console
    print(f"[OTP -> {phone}] Your InSureRide OTP is: {otp}  (request_id={request_id})")

    return request_id


def verify_otp(request_id: str, otp: str) -> Optional[str]:
    """
    Verify OTP for a given request_id.

    Returns:
        phone number if valid, None if invalid/expired.

    DEMO MODE: Accepts ANY 6-digit code so judges can test freely.
    """
    _cleanup_expired()

    entry = _otp_store.get(request_id)
    if entry is None:
        return None

    # Check expiry
    if entry["expires_at"] < time.time():
        del _otp_store[request_id]
        return None

    # In demo mode, accept any 6-digit OTP
    if DEMO_MODE or otp == entry["otp"]:
        phone = entry["phone"]
        del _otp_store[request_id]  # One-time use
        return phone

    return None
