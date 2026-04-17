"""Referral code generator (§11).

6-character alphanumeric, collision-checked against the riders table.
Excludes ambiguous characters (O/0, I/1) to survive voice/SMS handoff.
"""
from __future__ import annotations

import secrets

from sqlalchemy.orm import Session

from db import Rider

ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no O, 0, I, 1
CODE_LENGTH = 6
REFERRAL_DISCOUNT = 50.0  # rupees


def _random_code() -> str:
    return "".join(secrets.choice(ALPHABET) for _ in range(CODE_LENGTH))


def generate_code(db: Session, max_attempts: int = 20) -> str:
    for _ in range(max_attempts):
        code = _random_code()
        exists = db.query(Rider).filter(Rider.referral_code == code).first()
        if exists is None:
            return code
    raise RuntimeError("could_not_allocate_unique_referral_code")
