"""Unit tests for the profit guardrail."""
import math

import pytest

from profit_guardrail import CohortStats, profit_guardrail, REQUIRED_MARGIN


def test_low_loss_cohort_does_not_bump():
    # Tiny payouts -> guardrail floor is tiny -> proposed premium wins.
    cohort = CohortStats(cohort_id="LOW", active_policies=500, recent_payouts=2000.0)
    # expected_weekly_loss = 2000/500/4 = 1.0 rupee -> floor ~1.22 -> no bump
    assert profit_guardrail(78.0, cohort) == pytest.approx(78.0)


def test_high_loss_cohort_bumps_to_floor():
    # Big payouts -> floor exceeds proposed -> premium lifted to floor.
    # 200000 / 100 / 4 = 500/week; floor = 500/0.82 = 609.76
    cohort = CohortStats(cohort_id="HIGH", active_policies=100, recent_payouts=200_000.0)
    result = profit_guardrail(78.0, cohort)
    assert result == pytest.approx(500.0 / (1 - REQUIRED_MARGIN))
    assert result > 78.0


def test_empty_cohort_no_bump():
    cohort = CohortStats(cohort_id="EMPTY", active_policies=0, recent_payouts=0.0)
    assert profit_guardrail(42.0, cohort) == pytest.approx(42.0)


def test_zero_payouts_no_bump():
    cohort = CohortStats(cohort_id="NEW", active_policies=50, recent_payouts=0.0)
    assert profit_guardrail(50.0, cohort) == pytest.approx(50.0)


def test_custom_margin_raises_floor():
    cohort = CohortStats(cohort_id="X", active_policies=100, recent_payouts=40_000.0)
    # expected weekly loss = 100/week; floor at 30% margin = 100/0.7 ≈ 142.86
    assert profit_guardrail(80.0, cohort, required_margin=0.30) == pytest.approx(
        100.0 / 0.70
    )


def test_invalid_margin_rejected():
    cohort = CohortStats(cohort_id="X", active_policies=10, recent_payouts=100.0)
    with pytest.raises(ValueError):
        profit_guardrail(50.0, cohort, required_margin=1.0)


def test_floor_matches_target_margin():
    """If premium == floor, realised margin must equal required margin."""
    cohort = CohortStats(cohort_id="M", active_policies=100, recent_payouts=80_000.0)
    floor = profit_guardrail(0.0, cohort)
    realised_margin = (floor - cohort.expected_weekly_loss_per_rider) / floor
    assert math.isclose(realised_margin, REQUIRED_MARGIN, abs_tol=1e-9)
