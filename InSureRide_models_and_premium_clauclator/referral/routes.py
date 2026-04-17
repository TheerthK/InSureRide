"""Referral endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from db import Referral, Rider, get_db
from referral.code_gen import REFERRAL_DISCOUNT, generate_code
from referral.redemption import ReferralError, redeem
from schemas import (
    LeaderboardEntry,
    ReferralGenerateRequest,
    ReferralGenerateResponse,
    ReferralRedeemRequest,
    ReferralRedeemResponse,
)

router = APIRouter(prefix="/referral", tags=["referral"])


@router.post("/generate", response_model=ReferralGenerateResponse)
def generate(
    req: ReferralGenerateRequest, db: Session = Depends(get_db)
) -> ReferralGenerateResponse:
    rider = db.get(Rider, req.rider_id)
    if rider is None:
        raise HTTPException(status_code=404, detail="rider_not_found")

    if rider.referral_code:
        return ReferralGenerateResponse(rider_id=rider.id, code=rider.referral_code)

    rider.referral_code = generate_code(db)
    db.commit()
    return ReferralGenerateResponse(rider_id=rider.id, code=rider.referral_code)


@router.post("/redeem", response_model=ReferralRedeemResponse)
def redeem_code(
    req: ReferralRedeemRequest, db: Session = Depends(get_db)
) -> ReferralRedeemResponse:
    try:
        referral = redeem(db, req.code.upper(), req.new_rider_id)
    except ReferralError as err:
        raise HTTPException(status_code=400, detail=str(err))

    referrer = db.query(Rider).filter(Rider.referral_code == req.code.upper()).first()
    return ReferralRedeemResponse(
        credit_applied=REFERRAL_DISCOUNT,
        referrer_rider_id=referrer.id if referrer else None,
        status=referral.status,
    )


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def leaderboard(db: Session = Depends(get_db)) -> list[LeaderboardEntry]:
    rows = (
        db.query(
            Referral.referrer_code.label("code"),
            func.count(Referral.id).label("n"),
        )
        .filter(Referral.status == "ACTIVATED")
        .group_by(Referral.referrer_code)
        .order_by(func.count(Referral.id).desc())
        .limit(10)
        .all()
    )
    entries: list[LeaderboardEntry] = []
    for row in rows:
        rider = db.query(Rider).filter(Rider.referral_code == row.code).first()
        if rider is None:
            continue
        entries.append(
            LeaderboardEntry(
                rider_id=rider.id,
                referral_code=row.code,
                referral_count=row.n,
                rider_name=rider.platform_rider_id,
            )
        )
    return entries
