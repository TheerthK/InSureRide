"""Rider Trust Score (§8.1).

Trust Score = round(1000 × (
      0.30 × shift_consistency
    + 0.25 × earnings_consistency
    + 0.20 × normalized_star_rating
    + 0.15 × claim_history_factor
    + 0.10 × tenure_factor
))
"""
from __future__ import annotations

from dataclasses import dataclass

WEIGHTS = {
    "shift": 0.30,
    "earnings": 0.25,
    "rating": 0.20,
    "claim": 0.15,
    "tenure": 0.10,
}


@dataclass
class ScoreComponents:
    shift: float
    earnings: float
    rating: float
    claim: float
    tenure: float

    def as_dict(self) -> dict[str, float]:
        return {
            "shift": round(self.shift, 4),
            "earnings": round(self.earnings, 4),
            "rating": round(self.rating, 4),
            "claim": round(self.claim, 4),
            "tenure": round(self.tenure, 4),
        }


def _clip01(x: float) -> float:
    return max(0.0, min(1.0, x))


def _normalize_star_rating(star: float) -> float:
    return _clip01((star - 3.0) / 2.0)


def _claim_history_factor(claims_90d: int) -> float:
    return _clip01(1.0 - 0.1 * max(claims_90d, 0))


def _tenure_factor(weeks_on_platform: int) -> float:
    return _clip01(weeks_on_platform / 52.0)


def compute_score(
    shift_consistency: float,
    earnings_consistency: float,
    star_rating: float,
    claims_90d: int,
    weeks_on_platform: int,
) -> tuple[int, ScoreComponents]:
    components = ScoreComponents(
        shift=_clip01(shift_consistency),
        earnings=_clip01(earnings_consistency),
        rating=_normalize_star_rating(star_rating),
        claim=_claim_history_factor(claims_90d),
        tenure=_tenure_factor(weeks_on_platform),
    )
    raw = (
        WEIGHTS["shift"] * components.shift
        + WEIGHTS["earnings"] * components.earnings
        + WEIGHTS["rating"] * components.rating
        + WEIGHTS["claim"] * components.claim
        + WEIGHTS["tenure"] * components.tenure
    )
    return int(round(1000 * raw)), components
