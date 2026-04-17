"""Rider Trust Score endpoints."""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db import Claim, Rider, RiderStats, TrustScore, get_db
from rider_score.score_calc import compute_score
from rider_score.tier_mapping import tier_for_score
from schemas import TrustScoreBreakdown, TrustScoreResponse

router = APIRouter(prefix="/rider", tags=["rider-score"])


def _load_inputs(db: Session, rider_id: int) -> dict:
    rider = db.get(Rider, rider_id)
    if rider is None:
        raise HTTPException(status_code=404, detail="rider_not_found")
    stats = db.get(RiderStats, rider_id)
    claims_90d = (
        db.query(Claim).filter(Claim.rider_id == rider_id).count() if rider else 0
    )
    return {
        "rider": rider,
        "stats": stats,
        "claims_90d": claims_90d,
    }


def _score_for(rider_id: int, db: Session) -> TrustScoreResponse:
    data = _load_inputs(db, rider_id)
    stats = data["stats"]
    if stats is None:
        # Missing stats -> neutral midpoint so pipelines don't blow up.
        score, components = compute_score(
            shift_consistency=0.5,
            earnings_consistency=0.5,
            star_rating=4.0,
            claims_90d=data["claims_90d"],
            weeks_on_platform=0,
        )
    else:
        score, components = compute_score(
            shift_consistency=stats.shift_consistency or 0.0,
            earnings_consistency=stats.earnings_consistency or 0.0,
            star_rating=stats.star_rating or 0.0,
            claims_90d=data["claims_90d"],
            weeks_on_platform=stats.weeks_on_platform or 0,
        )
    tier = tier_for_score(score)
    return TrustScoreResponse(
        rider_id=rider_id,
        score=score,
        tier=tier,
        breakdown=TrustScoreBreakdown(**components.as_dict()),
    )


@router.get("/{rider_id}/score", response_model=TrustScoreResponse)
def get_score(rider_id: int, db: Session = Depends(get_db)) -> TrustScoreResponse:
    return _score_for(rider_id, db)


@router.post("/{rider_id}/recompute-score", response_model=TrustScoreResponse)
def recompute_score(
    rider_id: int, db: Session = Depends(get_db)
) -> TrustScoreResponse:
    resp = _score_for(rider_id, db)
    db.add(
        TrustScore(
            rider_id=rider_id,
            score=resp.score,
            tier=resp.tier,
            computed_at=datetime.utcnow(),
        )
    )
    db.commit()
    return resp
