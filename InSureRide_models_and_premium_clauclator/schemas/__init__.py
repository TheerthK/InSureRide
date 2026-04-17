"""Shared Pydantic schemas used by multiple routers."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class PremiumBreakdown(BaseModel):
    dl_score: float
    dl_base: float
    after_rules: float
    after_profit: float


class PremiumQuoteRequest(BaseModel):
    rider_id: int


class PremiumQuoteResponse(BaseModel):
    rider_id: int
    premium: float
    cohort_id: str
    risk_band: str
    trust_score: Optional[int] = None
    tier: Optional[str] = None
    breakdown: PremiumBreakdown
    covered_triggers: list[str]


class PolicyActivateRequest(BaseModel):
    rider_id: int
    premium: float


class PolicyActivateResponse(BaseModel):
    policy_id: int
    week_start: str
    week_end: str
    premium: float
    cohort_id: str


class TrustScoreBreakdown(BaseModel):
    shift: float
    earnings: float
    rating: float
    claim: float
    tenure: float


class TrustScoreResponse(BaseModel):
    rider_id: int
    score: int
    tier: str
    breakdown: TrustScoreBreakdown


class ReferralGenerateRequest(BaseModel):
    rider_id: int


class ReferralGenerateResponse(BaseModel):
    rider_id: int
    code: str


class ReferralRedeemRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)
    new_rider_id: int


class ReferralRedeemResponse(BaseModel):
    credit_applied: float
    referrer_rider_id: Optional[int] = None
    status: str


class LeaderboardEntry(BaseModel):
    rider_id: int
    referral_code: str
    referral_count: int
    rider_name: Optional[str] = None
