"""
InSureRide — Pydantic Request / Response Models
Central validation for every request body (OWASP input validation).
"""
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
import re


# ═══════════════════════════════════════════════════════════════════════════════
# AUTH
# ═══════════════════════════════════════════════════════════════════════════════

class OtpRequestIn(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15, examples=["+919876543210"])

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r"[\s\-]", "", v)
        if not re.match(r"^\+?91\d{10}$", cleaned):
            raise ValueError("Phone must be a valid Indian mobile number (+91XXXXXXXXXX)")
        return cleaned


class OtpVerifyIn(BaseModel):
    request_id: str = Field(..., min_length=1)
    otp: str = Field(..., min_length=6, max_length=6)

    @field_validator("otp")
    @classmethod
    def validate_otp(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("OTP must be 6 digits")
        return v


class RefreshTokenIn(BaseModel):
    refresh_token: str = Field(..., min_length=1)


class AuthTokenOut(BaseModel):
    access_token: str
    refresh_token: str
    rider_id: int
    token_type: str = "bearer"


class AccessTokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class OtpRequestOut(BaseModel):
    request_id: str
    message: str = "OTP sent successfully"


# ═══════════════════════════════════════════════════════════════════════════════
# ONBOARDING
# ═══════════════════════════════════════════════════════════════════════════════

class PlatformLinkIn(BaseModel):
    platform: str = Field(..., pattern=r"^(swiggy|zomato|zepto|blinkit|dunzo|amazon)$")
    rider_id: str = Field(..., min_length=3, max_length=50)


class PlatformLinkOut(BaseModel):
    linked: bool = True
    platform: str
    rider_id: str


class RiderStatsOut(BaseModel):
    star_rating: float
    weeks_on_platform: int
    avg_weekly_hours: float
    total_incentives_4wk: float
    bonus_history_4wk: float
    shift_consistency: float
    earnings_consistency: float


class ZoneSetIn(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class ZoneSetOut(BaseModel):
    zone_name: str
    lat: float
    lng: float


class UpiLinkIn(BaseModel):
    vpa: str = Field(..., min_length=3, max_length=100)

    @field_validator("vpa")
    @classmethod
    def validate_vpa(cls, v: str) -> str:
        if not re.match(r"^[\w.\-]+@[\w]+$", v):
            raise ValueError("Invalid UPI VPA format (expected: name@bank)")
        return v


class UpiLinkOut(BaseModel):
    verified: bool = True
    vpa: str


# ═══════════════════════════════════════════════════════════════════════════════
# FRAUD DETECTION
# ═══════════════════════════════════════════════════════════════════════════════

class FraudScoreIn(BaseModel):
    claim_id: int


class FraudFlag(BaseModel):
    layer: str
    result: str
    details: str


class FraudScoreOut(BaseModel):
    claim_id: int
    score: float
    decision: str   # APPROVE, SYNCUP, REJECT, BLOCKED
    flags: List[FraudFlag]


class ClusterAlert(BaseModel):
    cluster_id: str
    size: int
    grouping_key: str
    pin_code: Optional[str] = None
    detected_at: str
    status: str  # FROZEN, REVIEWED, CLEARED


class SyncUpIn(BaseModel):
    selfie_b64: str = Field(..., min_length=10)
    gps_lat: float = Field(..., ge=-90, le=90)
    gps_lng: float = Field(..., ge=-180, le=180)


class SyncUpOut(BaseModel):
    claim_id: int
    new_score: float
    decision: str
    message: str


# ═══════════════════════════════════════════════════════════════════════════════
# CHATBOT
# ═══════════════════════════════════════════════════════════════════════════════

class ChatIn(BaseModel):
    rider_id: int
    message: str = Field(..., min_length=1, max_length=1000)
    lang: str = Field(default="en", pattern=r"^(en|hi|ta|te|kn|bn)$")


class ChatOut(BaseModel):
    reply: str
    intent: str
    suggested_actions: List[str]


# ═══════════════════════════════════════════════════════════════════════════════
# GENERIC
# ═══════════════════════════════════════════════════════════════════════════════

class MessageOut(BaseModel):
    message: str
    success: bool = True
