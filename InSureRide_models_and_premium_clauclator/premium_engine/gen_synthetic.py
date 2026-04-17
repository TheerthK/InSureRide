"""Synthetic training data generator for the premium DL model.

Produces 5,000 rows with the ground-truth formula:
    premium = base + zone_factor + claim_factor + noise

The DL model learns a smoother approximation of this, and the rule layer
+ profit guardrail wrap it in business rules at serve time.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from premium_engine import FEATURE_COLUMNS, MAX_CAP, MIN_FLOOR  # noqa: E402

RNG_SEED = 42
N_ROWS = 5000


def _sample_features(rng: np.random.Generator, n: int) -> pd.DataFrame:
    return pd.DataFrame(
        {
            "star_rating": rng.uniform(3.5, 5.0, n),
            "weeks_on_platform": rng.integers(1, 260, n),
            "avg_weekly_hours": rng.uniform(10, 80, n),
            "claim_count_90d": rng.poisson(0.4, n),
            "zone_risk_index": rng.beta(2, 3, n),
            "weather_forecast_risk": rng.beta(2, 3, n),
            "aqi_forecast_risk": rng.beta(2, 4, n),
            "traffic_congestion_index": rng.beta(2, 3, n),
            "cohort_loss_ratio": rng.beta(3, 5, n),
            "incentive_achievement_rate": rng.beta(5, 3, n),
            "shift_consistency": rng.beta(4, 2, n),
            "vehicle_type_scalar": rng.uniform(0.4, 1.0, n),
        }
    )


def _ground_truth_premium(df: pd.DataFrame, rng: np.random.Generator) -> np.ndarray:
    """Closed-form premium used to label synthetic rows."""
    base = 50.0
    zone_factor = (
        25.0 * df["zone_risk_index"]
        + 20.0 * df["weather_forecast_risk"]
        + 10.0 * df["aqi_forecast_risk"]
        + 8.0 * df["traffic_congestion_index"]
    )
    claim_factor = 12.0 * df["claim_count_90d"]
    cohort_factor = 30.0 * df["cohort_loss_ratio"]
    reward = (
        -8.0 * (df["star_rating"] - 4.0)
        - 6.0 * df["shift_consistency"]
        - 2.5 * np.minimum(df["weeks_on_platform"] / 52.0, 2.0)
    )
    noise = rng.normal(0, 3.0, len(df))
    raw = base + zone_factor + claim_factor + cohort_factor + reward + noise
    return np.clip(raw, MIN_FLOOR, MAX_CAP)


def generate(n_rows: int = N_ROWS, out_path: str | None = None) -> pd.DataFrame:
    rng = np.random.default_rng(RNG_SEED)
    df = _sample_features(rng, n_rows)
    df["premium"] = _ground_truth_premium(df, rng)

    assert list(df.columns[:-1]) == FEATURE_COLUMNS, "feature column order drift"

    if out_path:
        Path(out_path).parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(out_path, index=False)
    return df


if __name__ == "__main__":
    out = os.getenv(
        "SYNTH_OUT",
        str(Path(__file__).resolve().parents[1] / "data" / "synth.csv"),
    )
    df = generate(out_path=out)
    print(f"Wrote {len(df)} rows to {out}")
    print(df.describe().T[["mean", "std", "min", "max"]])
