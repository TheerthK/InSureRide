"""Trust-score tier bands (§8.2)."""
from __future__ import annotations

TIERS = [
    (0, 399, "Bronze", 1.10),
    (400, 699, "Silver", 1.00),
    (700, 899, "Gold", 0.90),
    (900, 1000, "Platinum", 0.85),
]


def tier_for_score(score: int) -> str:
    for lo, hi, name, _ in TIERS:
        if lo <= score <= hi:
            return name
    return "Silver"


def premium_multiplier(score: int) -> float:
    for lo, hi, _, mult in TIERS:
        if lo <= score <= hi:
            return mult
    return 1.0
