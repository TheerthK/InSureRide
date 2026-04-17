"""Unit tests for the rider trust score + tier mapping."""
import pytest

from rider_score import compute_score, premium_multiplier, tier_for_score


def test_perfect_rider_hits_platinum():
    score, _ = compute_score(
        shift_consistency=1.0,
        earnings_consistency=1.0,
        star_rating=5.0,
        claims_90d=0,
        weeks_on_platform=104,
    )
    assert score == 1000
    assert tier_for_score(score) == "Platinum"
    assert premium_multiplier(score) == pytest.approx(0.85)


def test_ravi_kumar_is_gold():
    """Persona numbers from MASTER_DOC §2/§7.6 land near 847 Gold."""
    score, components = compute_score(
        shift_consistency=0.92,
        earnings_consistency=0.85,
        star_rating=4.6,
        claims_90d=0,
        weeks_on_platform=104,
    )
    assert 700 <= score <= 899
    assert tier_for_score(score) == "Gold"
    # Sanity-check weights: rating component must be normalized star
    assert components.rating == pytest.approx(0.8)


def test_heavy_claims_drop_score():
    high, _ = compute_score(0.9, 0.9, 4.8, claims_90d=0, weeks_on_platform=80)
    low, _ = compute_score(0.9, 0.9, 4.8, claims_90d=10, weeks_on_platform=80)
    assert low < high


def test_rookie_rider_low_tenure():
    score, comps = compute_score(0.6, 0.6, 4.0, claims_90d=0, weeks_on_platform=2)
    assert comps.tenure == pytest.approx(2 / 52.0)
    assert tier_for_score(score) in ("Bronze", "Silver")


def test_tier_boundaries():
    assert tier_for_score(0) == "Bronze"
    assert tier_for_score(399) == "Bronze"
    assert tier_for_score(400) == "Silver"
    assert tier_for_score(699) == "Silver"
    assert tier_for_score(700) == "Gold"
    assert tier_for_score(899) == "Gold"
    assert tier_for_score(900) == "Platinum"
    assert tier_for_score(1000) == "Platinum"
