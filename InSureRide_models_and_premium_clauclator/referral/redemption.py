"""Referral redemption flow (§11.1)."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from db import Referral, Rider

MAX_REFERRALS_PER_RIDER = 5


class ReferralError(Exception):
    pass


def count_successful_referrals(db: Session, referrer_code: str) -> int:
    return (
        db.query(Referral)
        .filter(
            Referral.referrer_code == referrer_code,
            Referral.status == "ACTIVATED",
        )
        .count()
    )


def redeem(db: Session, code: str, new_rider_id: int) -> Referral:
    referrer = db.query(Rider).filter(Rider.referral_code == code).first()
    if referrer is None:
        raise ReferralError("referral_code_not_found")

    referee = db.get(Rider, new_rider_id)
    if referee is None:
        raise ReferralError("referee_not_found")

    if referrer.id == referee.id:
        raise ReferralError("self_referral_forbidden")

    if count_successful_referrals(db, code) >= MAX_REFERRALS_PER_RIDER:
        raise ReferralError("referral_cap_reached")

    existing = (
        db.query(Referral).filter(Referral.referee_id == new_rider_id).first()
    )
    if existing is not None:
        raise ReferralError("referee_already_redeemed")

    referral = Referral(
        referrer_code=code,
        referee_id=new_rider_id,
        status="ACTIVATED",
        credit_applied=False,
        created_at=datetime.utcnow(),
    )
    db.add(referral)

    referee.referred_by = code

    db.commit()
    db.refresh(referral)
    return referral
