"""Profit guardrail (§7.4).

Pricing promise to the insurer: a cohort's premium floor is pegged to its
expected weekly loss divided by (1 - target margin). This guarantees that
the DL/rule pipeline cannot price a cohort into a loss.
"""
from __future__ import annotations

from dataclasses import dataclass

REQUIRED_MARGIN = 0.18


@dataclass
class CohortStats:
    cohort_id: str
    active_policies: int
    recent_payouts: float  # rupees, last 4 weeks summed

    @property
    def expected_weekly_loss_per_rider(self) -> float:
        if self.active_policies <= 0:
            return 0.0
        # 4-week window -> per-week average
        return (self.recent_payouts / self.active_policies) / 4.0


def profit_guardrail(
    proposed_premium: float,
    cohort: CohortStats,
    required_margin: float = REQUIRED_MARGIN,
) -> float:
    """Return max(proposed_premium, min_premium_from_margin).

    min_premium = expected_weekly_loss_per_rider / (1 - required_margin)
    """
    if required_margin >= 1.0:
        raise ValueError("required_margin must be < 1.0")
    expected_loss = cohort.expected_weekly_loss_per_rider
    min_premium = expected_loss / (1.0 - required_margin) if expected_loss > 0 else 0.0
    return max(proposed_premium, min_premium)
