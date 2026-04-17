"""Cohort admin routes."""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from cohort_pricing.clustering import CohortFeatures, cluster_riders
from cohort_pricing.cohort_repo import get_or_create_cohort
from db import Cohort, Policy, Rider, get_db

router = APIRouter(prefix="/cohort", tags=["cohort"])


@router.post("/recompute")
def recompute_cohorts(k: int = 20, db: Session = Depends(get_db)) -> dict:
    """Re-cluster every rider with an active policy into k cohorts."""
    rider_rows = (
        db.query(Rider)
        .join(Policy, Policy.rider_id == Rider.id)
        .filter(Policy.status == "ACTIVE")
        .all()
    )
    features = [
        CohortFeatures(
            rider_id=r.id,
            zone_lat=r.zone_lat or 0.0,
            zone_lng=r.zone_lng or 0.0,
        )
        for r in rider_rows
    ]
    assignments = cluster_riders(features, k=k)

    counts: dict[str, int] = {}
    rider_by_id = {r.id: r for r in rider_rows}
    for rider_id, cohort_id in assignments.items():
        rider = rider_by_id[rider_id]
        get_or_create_cohort(
            db,
            cohort_id,
            centroid_lat=rider.zone_lat or 0.0,
            centroid_lng=rider.zone_lng or 0.0,
        )
        counts[cohort_id] = counts.get(cohort_id, 0) + 1
        policy = (
            db.query(Policy)
            .filter(Policy.rider_id == rider_id, Policy.status == "ACTIVE")
            .first()
        )
        if policy:
            policy.cohort_id = cohort_id

    for cohort_id, count in counts.items():
        cohort = db.get(Cohort, cohort_id)
        if cohort is not None:
            cohort.active_policies = count
            cohort.recomputed_at = datetime.utcnow()

    db.commit()
    return {"cohorts": len(counts), "riders_assigned": len(assignments)}


@router.get("/{cohort_id}")
def fetch_cohort(cohort_id: str, db: Session = Depends(get_db)) -> dict:
    cohort = db.get(Cohort, cohort_id)
    if cohort is None:
        return {"error": "cohort_not_found", "cohort_id": cohort_id}
    return {
        "id": cohort.id,
        "centroid": {"lat": cohort.centroid_lat, "lng": cohort.centroid_lng},
        "shift_window": cohort.shift_window,
        "vehicle_type": cohort.vehicle_type,
        "active_policies": cohort.active_policies,
        "loss_ratio": cohort.loss_ratio,
        "recent_payouts": cohort.recent_payouts,
    }
