"""Rule layer applied on top of the DL model output (§7.3)."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class RuleContext:
    trust_score: int
    tenure_weeks: int
    cohort_active_policies: int
    has_referral_credit: bool = False
    referral_discount: float = 50.0


def rule_adjust(base_premium: float, ctx: RuleContext) -> float:
    premium = base_premium

    if ctx.trust_score >= 900:
        premium *= 0.85
    elif ctx.trust_score >= 700:
        premium *= 0.90

    if ctx.tenure_weeks < 4:
        premium *= 1.10

    if ctx.cohort_active_policies >= 200:
        premium *= 0.95

    if ctx.has_referral_credit:
        premium -= ctx.referral_discount

    return premium


def risk_band(risk_score: float) -> str:
    if risk_score < 0.33:
        return "low"
    if risk_score < 0.66:
        return "medium"
    return "high"
