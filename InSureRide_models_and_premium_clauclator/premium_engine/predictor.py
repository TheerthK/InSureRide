"""Premium prediction wrapper.

Loads the trained Keras model lazily. If the model file is missing (fresh
clone, or TF not installed), falls back to a deterministic analytic
approximation so the rest of the service still runs.
"""
from __future__ import annotations

import json
import threading
from pathlib import Path
from typing import Any

import numpy as np

from premium_engine import FEATURE_COLUMNS, MAX_CAP, MIN_FLOOR

_MODEL_DIR = Path(__file__).resolve().parents[1] / "models"
_MODEL_PATH = _MODEL_DIR / "premium_model.h5"
_META_PATH = _MODEL_DIR / "premium_meta.json"


class PremiumPredictor:
    """Thread-safe singleton wrapper around the Keras model."""

    _instance: "PremiumPredictor | None" = None
    _lock = threading.Lock()

    def __new__(cls) -> "PremiumPredictor":
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._init()
        return cls._instance

    def _init(self) -> None:
        self._model = None
        self._meta: dict[str, Any] | None = None
        self._load()

    def _load(self) -> None:
        if not _MODEL_PATH.exists() or not _META_PATH.exists():
            return
        try:
            from tensorflow import keras

            self._model = keras.models.load_model(_MODEL_PATH, compile=False)
            self._meta = json.loads(_META_PATH.read_text())
        except Exception as e:  # tensorflow not installed, or corrupt model
            print(f"[PremiumPredictor] model unavailable ({e}); using fallback")
            self._model = None
            self._meta = None

    @property
    def is_trained(self) -> bool:
        return self._model is not None and self._meta is not None

    def _vector(self, features: dict[str, float]) -> np.ndarray:
        return np.array(
            [float(features.get(col, 0.0)) for col in FEATURE_COLUMNS], dtype=np.float32
        )

    def predict(self, features: dict[str, float]) -> dict[str, float]:
        """Return {"risk_score": 0-1, "base_premium": rupees}."""
        x = self._vector(features)
        if self.is_trained:
            assert self._meta is not None
            means = np.array(
                [self._meta["normalization"]["means"][c] for c in FEATURE_COLUMNS],
                dtype=np.float32,
            )
            stds = np.array(
                [self._meta["normalization"]["stds"][c] for c in FEATURE_COLUMNS],
                dtype=np.float32,
            )
            xn = ((x - means) / stds).reshape(1, -1)
            risk = float(self._model.predict(xn, verbose=0)[0, 0])
        else:
            risk = self._fallback_risk(features)
        base = MIN_FLOOR + risk * (MAX_CAP - MIN_FLOOR)
        return {"risk_score": risk, "base_premium": base}

    @staticmethod
    def _fallback_risk(f: dict[str, float]) -> float:
        """Analytic stand-in used until the Keras model is trained.

        Mirrors the shape of the synthetic ground truth so tests and
        demos behave sensibly even without a model artifact.
        """
        raw = (
            50.0
            + 25.0 * f.get("zone_risk_index", 0.5)
            + 20.0 * f.get("weather_forecast_risk", 0.5)
            + 10.0 * f.get("aqi_forecast_risk", 0.3)
            + 8.0 * f.get("traffic_congestion_index", 0.4)
            + 30.0 * f.get("cohort_loss_ratio", 0.4)
            + 12.0 * f.get("claim_count_90d", 0)
            - 8.0 * (f.get("star_rating", 4.0) - 4.0)
            - 6.0 * f.get("shift_consistency", 0.6)
            - 2.5 * min(f.get("weeks_on_platform", 20) / 52.0, 2.0)
        )
        raw = max(MIN_FLOOR, min(MAX_CAP, raw))
        return (raw - MIN_FLOOR) / (MAX_CAP - MIN_FLOOR)
