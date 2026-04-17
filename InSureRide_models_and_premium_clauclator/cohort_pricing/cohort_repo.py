"""Cohort DB access."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from db import Cohort


def get_cohort(db: Session, cohort_id: str) -> Cohort | None:
    return db.get(Cohort, cohort_id)


def get_or_create_cohort(
    db: Session,
    cohort_id: str,
    centroid_lat: float,
    centroid_lng: float,
    shift_window: str = "evening",
    vehicle_type: str = "bike",
) -> Cohort:
    cohort = get_cohort(db, cohort_id)
    if cohort is None:
        cohort = Cohort(
            id=cohort_id,
            centroid_lat=centroid_lat,
            centroid_lng=centroid_lng,
            shift_window=shift_window,
            vehicle_type=vehicle_type,
            active_policies=0,
            loss_ratio=0.0,
            recent_payouts=0.0,
            recomputed_at=datetime.utcnow(),
        )
        db.add(cohort)
        db.commit()
        db.refresh(cohort)
    return cohort


def increment_cohort_policies(db: Session, cohort_id: str, delta: int = 1) -> None:
    cohort = get_cohort(db, cohort_id)
    if cohort is None:
        return
    cohort.active_policies = max(0, (cohort.active_policies or 0) + delta)
    db.commit()


def record_cohort_payout(db: Session, cohort_id: str, amount: float) -> None:
    cohort = get_cohort(db, cohort_id)
    if cohort is None:
        return
    cohort.recent_payouts = (cohort.recent_payouts or 0.0) + amount
    if cohort.active_policies:
        cohort.loss_ratio = cohort.recent_payouts / (cohort.active_policies * 78.0)
    db.commit()
