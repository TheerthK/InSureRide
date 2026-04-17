"""K-means cohort clustering (§7.5).

Rebuilds cohorts every Sunday over (zone_lat, zone_lng, shift_window_enc,
vehicle_type_enc). k=20 by default, clamped when the rider pool is small.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

import numpy as np
from sklearn.cluster import KMeans

SHIFT_WINDOW_MAP = {"morning": 0.0, "afternoon": 0.33, "evening": 0.66, "night": 1.0}
VEHICLE_TYPE_MAP = {"bike": 0.2, "scooter": 0.4, "ebike": 0.6, "bicycle": 0.8, "other": 1.0}

DEFAULT_K = 20


@dataclass
class CohortFeatures:
    rider_id: int
    zone_lat: float
    zone_lng: float
    shift_window: str = "evening"
    vehicle_type: str = "bike"

    def to_vector(self) -> list[float]:
        return [
            self.zone_lat / 90.0,
            self.zone_lng / 180.0,
            SHIFT_WINDOW_MAP.get(self.shift_window, 0.5),
            VEHICLE_TYPE_MAP.get(self.vehicle_type, 0.5),
        ]


def _cohort_id(centroid: np.ndarray, cluster_idx: int) -> str:
    lat = centroid[0] * 90.0
    lng = centroid[1] * 180.0
    return f"C{cluster_idx:02d}-{lat:+.2f}-{lng:+.2f}"


def cluster_riders(
    riders: Iterable[CohortFeatures], k: int = DEFAULT_K, seed: int = 7
) -> dict[int, str]:
    """Cluster riders and return {rider_id: cohort_id}.

    Also returns deterministic cohort IDs derived from centroid coordinates
    so the same geography maps to the same ID across re-runs.
    """
    rows = list(riders)
    if not rows:
        return {}

    X = np.array([r.to_vector() for r in rows], dtype=np.float32)
    k_eff = max(1, min(k, len(rows)))
    km = KMeans(n_clusters=k_eff, random_state=seed, n_init=10)
    labels = km.fit_predict(X)

    cohort_ids = {
        idx: _cohort_id(km.cluster_centers_[idx], idx) for idx in range(k_eff)
    }
    return {rider.rider_id: cohort_ids[int(labels[i])] for i, rider in enumerate(rows)}


def cohort_id_for_rider(features: CohortFeatures) -> str:
    """Deterministic single-rider cohort bucketing when full clustering hasn't run."""
    # Coarse grid: 0.25° lat/lng × shift × vehicle -> stable, readable ID.
    lat_bin = round(features.zone_lat * 4) / 4
    lng_bin = round(features.zone_lng * 4) / 4
    shift = features.shift_window[:3].upper()
    vt = features.vehicle_type[:3].upper()
    return f"G-{lat_bin:+.2f}-{lng_bin:+.2f}-{shift}-{vt}"
