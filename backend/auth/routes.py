"""
InSureRide — Auth API Routes
POST /auth/request-otp
POST /auth/verify-otp
POST /auth/refresh
"""
import random
import string
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from db import get_db
from models import Rider
from auth.otp_service import request_otp, verify_otp
from auth.jwt_service import create_access_token, create_refresh_token, verify_token
from security.validation import (
    OtpRequestIn, OtpRequestOut,
    OtpVerifyIn, AuthTokenOut,
    RefreshTokenIn, AccessTokenOut,
)
from security.audit_log import write_audit
from security.rate_limit import limiter

router = APIRouter(prefix="/auth", tags=["Auth"])


def _generate_referral_code() -> str:
    """Generate a unique 6-char alphanumeric referral code."""
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


@router.post("/request-otp", response_model=OtpRequestOut)
@limiter.limit("10/minute")
async def api_request_otp(body: OtpRequestIn, request: Request, db: Session = Depends(get_db)):
    """
    Send OTP to the given phone number.
    In demo mode the OTP is printed to the console.
    """
    req_id = request_otp(body.phone)

    write_audit(db, "RIDER", body.phone, "otp_requested", {"phone": body.phone})

    return OtpRequestOut(request_id=req_id)


@router.post("/verify-otp", response_model=AuthTokenOut)
@limiter.limit("10/minute")
async def api_verify_otp(body: OtpVerifyIn, request: Request, db: Session = Depends(get_db)):
    """
    Verify OTP and issue JWT tokens.
    Creates a new rider record if this phone hasn't been seen before.
    """
    phone = verify_otp(body.request_id, body.otp)
    if phone is None:
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")

    # Find or create rider
    rider = db.query(Rider).filter(Rider.phone == phone).first()
    if rider is None:
        rider = Rider(
            phone=phone,
            language="en",
            created_at=datetime.utcnow(),
            referral_code=_generate_referral_code(),
        )
        db.add(rider)
        db.commit()
        db.refresh(rider)

    access = create_access_token(rider.id)
    refresh = create_refresh_token(rider.id)

    write_audit(db, "RIDER", str(rider.id), "otp_verified", {"rider_id": rider.id})

    return AuthTokenOut(
        access_token=access,
        refresh_token=refresh,
        rider_id=rider.id,
    )


@router.post("/refresh", response_model=AccessTokenOut)
@limiter.limit("10/minute")
async def api_refresh_token(body: RefreshTokenIn, request: Request, db: Session = Depends(get_db)):
    """
    Exchange a valid refresh token for a new access token.
    """
    rider_id = verify_token(body.refresh_token, expected_type="refresh")
    if rider_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    # Verify rider still exists
    rider = db.query(Rider).filter(Rider.id == rider_id).first()
    if rider is None:
        raise HTTPException(status_code=404, detail="Rider not found")

    new_access = create_access_token(rider_id)

    return AccessTokenOut(access_token=new_access)
