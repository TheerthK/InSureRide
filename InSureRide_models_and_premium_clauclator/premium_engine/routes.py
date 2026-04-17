"""Premium + policy endpoints.

Composes: DL predictor → rule layer → profit guardrail.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from cohort_pricing.clustering import CohortFeatures, cohort_id_for_rider
from cohort_pricing.cohort_repo import (
    get_or_create_cohort,
    increment_cohort_policies,
)
from db import Claim, Policy, Referral, Rider, RiderStats, get_db
from premium_engine import MAX_CAP, MIN_FLOOR
from premium_engine.predictor import PremiumPredictor
from premium_engine.rule_layer import RuleContext, risk_band, rule_adjust
from profit_guardrail import CohortStats, profit_guardrail
from rider_score.score_calc import compute_score
from rider_score.tier_mapping import tier_for_score
from schemas import (
    PolicyActivateRequest,
    PolicyActivateResponse,
    PremiumBreakdown,
    PremiumQuoteRequest,
    PremiumQuoteResponse,
)

router = APIRouter(tags=["premium"])

COVERED_TRIGGERS = [
    "heavy_rain",
    "extreme_heat",
    "severe_aqi",
    "heavy_traffic",
    "platform_outage",
    "restaurant_closure",
    "wrong_address_loop",
    "unsafe_neighbourhood",
    "animal_attack",
    "curfew",
    "vehicle_zone_issue",
    "slot_lockout",
]


def _week_bounds(today: date | None = None) -> tuple[date, date]:
    today = today or date.today()
    monday = today - timedelta(days=today.weekday())
    sunday = monday + timedelta(days=6)
    return monday, sunday


def _build_features(
    rider: Rider, stats: RiderStats | None, cohort_loss_ratio: float, claims_90d: int
) -> dict[str, float]:
    star = stats.star_rating if stats else 4.0
    weeks = stats.weeks_on_platform if stats else 4
    hours = stats.avg_weekly_hours if stats else 40.0
    shift_cons = stats.shift_consistency if stats else 0.6
    incentive_rate = 0.7
    if stats and stats.total_incentives_4wk is not None:
        # crude proxy: incentives > ₹2,000 over 4 weeks → high achievement
        incentive_rate = min(1.0, (stats.total_incentives_4wk or 0) / 3000.0)
    return {
        "star_rating": star,
        "weeks_on_platform": weeks,
        "avg_weekly_hours": hours,
        "claim_count_90d": claims_90d,
        "zone_risk_index": 0.55,
        "weather_forecast_risk": 0.45,
        "aqi_forecast_risk": 0.30,
        "traffic_congestion_index": 0.40,
        "cohort_loss_ratio": cohort_loss_ratio,
        "incentive_achievement_rate": incentive_rate,
        "shift_consistency": shift_cons,
        "vehicle_type_scalar": 0.6,
    }


@router.post("/premium/quote", response_model=PremiumQuoteResponse)
def quote_premium(req: PremiumQuoteRequest, db: Session = Depends(get_db)) -> PremiumQuoteResponse:
    rider = db.get(Rider, req.rider_id)
    if rider is None:
        raise HTTPException(status_code=404, detail="rider_not_found")
    stats = db.get(RiderStats, req.rider_id)
    claims_90d = db.query(Claim).filter(Claim.rider_id == req.rider_id).count()

    cohort_features = CohortFeatures(
        rider_id=rider.id,
        zone_lat=rider.zone_lat or 0.0,
        zone_lng=rider.zone_lng or 0.0,
    )
    cohort_id = cohort_id_for_rider(cohort_features)
    cohort = get_or_create_cohort(
        db,
        cohort_id,
        centroid_lat=rider.zone_lat or 0.0,
        centroid_lng=rider.zone_lng or 0.0,
    )

    features = _build_features(
        rider, stats, cohort.loss_ratio or 0.0, claims_90d
    )

    predictor = PremiumPredictor()
    dl = predictor.predict(features)
    dl_base = dl["base_premium"]

    trust_score, _ = compute_score(
        shift_consistency=(stats.shift_consistency if stats else 0.0) or 0.0,
        earnings_consistency=(stats.earnings_consistency if stats else 0.0) or 0.0,
        star_rating=(stats.star_rating if stats else 0.0) or 0.0,
        claims_90d=claims_90d,
        weeks_on_platform=(stats.weeks_on_platform if stats else 0) or 0,
    )
    tier = tier_for_score(trust_score)

    referral_active = (
        db.query(Referral)
        .filter(Referral.referee_id == rider.id, Referral.credit_applied.is_(False))
        .first()
        is not None
    )

    ctx = RuleContext(
        trust_score=trust_score,
        tenure_weeks=(stats.weeks_on_platform if stats else 0) or 0,
        cohort_active_policies=cohort.active_policies or 0,
        has_referral_credit=referral_active,
    )
    after_rules = rule_adjust(dl_base, ctx)

    cohort_stats = CohortStats(
        cohort_id=cohort.id,
        active_policies=cohort.active_policies or 0,
        recent_payouts=cohort.recent_payouts or 0.0,
    )
    after_profit = profit_guardrail(after_rules, cohort_stats)
    final = max(MIN_FLOOR, min(MAX_CAP, after_profit))

    return PremiumQuoteResponse(
        rider_id=rider.id,
        premium=round(final, 2),
        cohort_id=cohort.id,
        risk_band=risk_band(dl["risk_score"]),
        trust_score=trust_score,
        tier=tier,
        breakdown=PremiumBreakdown(
            dl_score=round(dl["risk_score"], 4),
            dl_base=round(dl_base, 2),
            after_rules=round(after_rules, 2),
            after_profit=round(after_profit, 2),
        ),
        covered_triggers=COVERED_TRIGGERS,
    )


@router.post("/policy/activate", response_model=PolicyActivateResponse)
def activate_policy(
    req: PolicyActivateRequest, db: Session = Depends(get_db)
) -> PolicyActivateResponse:
    rider = db.get(Rider, req.rider_id)
    if rider is None:
        raise HTTPException(status_code=404, detail="rider_not_found")

    week_start, week_end = _week_bounds()
    cohort_id = cohort_id_for_rider(
        CohortFeatures(
            rider_id=rider.id,
            zone_lat=rider.zone_lat or 0.0,
            zone_lng=rider.zone_lng or 0.0,
        )
    )
    get_or_create_cohort(
        db,
        cohort_id,
        centroid_lat=rider.zone_lat or 0.0,
        centroid_lng=rider.zone_lng or 0.0,
    )

    policy = Policy(
        rider_id=rider.id,
        week_start=week_start,
        week_end=week_end,
        premium_paid=req.premium,
        cohort_id=cohort_id,
        status="ACTIVE",
        created_at=datetime.utcnow(),
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    increment_cohort_policies(db, cohort_id, delta=1)

    return PolicyActivateResponse(
        policy_id=policy.id,
        week_start=str(week_start),
        week_end=str(week_end),
        premium=req.premium,
        cohort_id=cohort_id,
    )


@router.get("/policy/active/{rider_id}")
def get_active_policy(rider_id: int, db: Session = Depends(get_db)) -> dict:
    policy = (
        db.query(Policy)
        .filter(Policy.rider_id == rider_id, Policy.status == "ACTIVE")
        .order_by(Policy.id.desc())
        .first()
    )
    if policy is None:
        raise HTTPException(status_code=404, detail="no_active_policy")
    return {
        "policy_id": policy.id,
        "rider_id": policy.rider_id,
        "week_start": str(policy.week_start),
        "week_end": str(policy.week_end),
        "premium_paid": policy.premium_paid,
        "cohort_id": policy.cohort_id,
        "status": policy.status,
        "covered_triggers": COVERED_TRIGGERS,
    }
