"""
InSureRide — Fraud Layer 3: Isolation Forest (Behavioral Anomaly)
Sklearn IsolationForest trained on synthetic behavioral data.

Features per claim:
1. GPS jitter variance (zero = spoofer)
2. Login-to-trigger time delta (minutes)
3. Account age (days)
4. Historical claim frequency (claims per 30 days)
5. Order-assignment-rate during trigger window (0–1)
6. Distance between claimed location and 30-day centroid (km)

Output: anomaly score 0–1 (higher = more suspicious).
"""
import os
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest

from config import MODELS_DIR, ISOLATION_FOREST_CONTAMINATION

MODEL_PATH = os.path.join(MODELS_DIR, "fraud_model.pkl")


def generate_synthetic_training_data(n_normal: int = 4750, n_fraud: int = 250) -> np.ndarray:
    """
    Generate synthetic behavioral data for training.
    Normal riders have natural patterns; fraud has telltale signatures.
    """
    rng = np.random.RandomState(42)

    # Normal rider behavior
    normal = np.column_stack([
        rng.uniform(0.01, 0.5, n_normal),     # GPS jitter variance (normal movement)
        rng.uniform(30, 480, n_normal),        # Login-to-trigger delta: 30 min – 8 hours (already online)
        rng.uniform(30, 720, n_normal),        # Account age: 1 month – 2 years
        rng.uniform(0, 2, n_normal),           # Claims/30d: 0–2 (low)
        rng.uniform(0.0, 0.15, n_normal),      # Order rate during disruption: near zero
        rng.uniform(0.1, 3.0, n_normal),       # Distance from centroid: close to usual area
    ])

    # Fraudulent behavior
    fraud = np.column_stack([
        rng.uniform(0.0, 0.005, n_fraud),      # GPS jitter: nearly zero (spoofed static location)
        rng.uniform(0, 10, n_fraud),            # Login just after trigger (suspiciously fast)
        rng.uniform(1, 14, n_fraud),            # Very new accounts
        rng.uniform(3, 8, n_fraud),             # High claim frequency
        rng.uniform(0.3, 0.8, n_fraud),         # Still receiving orders (not really disrupted)
        rng.uniform(5.0, 50.0, n_fraud),        # Far from usual activity area
    ])

    return np.vstack([normal, fraud])


def train_model() -> IsolationForest:
    """
    Train the Isolation Forest on synthetic data and save to disk.
    """
    os.makedirs(MODELS_DIR, exist_ok=True)

    X = generate_synthetic_training_data()

    model = IsolationForest(
        contamination=ISOLATION_FOREST_CONTAMINATION,
        n_estimators=150,
        max_samples="auto",
        random_state=42,
    )
    model.fit(X)

    joblib.dump(model, MODEL_PATH)
    print(f"[Fraud Layer 3] Model trained on {len(X)} samples, saved to {MODEL_PATH}")
    return model


def _load_model() -> IsolationForest:
    """Load the model from disk, or train a fresh one."""
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    return train_model()


# Module-level model (lazy loaded)
_model: IsolationForest | None = None


def get_model() -> IsolationForest:
    global _model
    if _model is None:
        _model = _load_model()
    return _model


def predict_anomaly_score(
    gps_jitter_variance: float,
    login_trigger_delta_min: float,
    account_age_days: int,
    claim_frequency_30d: float,
    order_rate_during_trigger: float,
    distance_from_centroid_km: float,
) -> float:
    """
    Run the Isolation Forest on a single claim's features.

    Returns:
        Anomaly score 0–1 (higher = more suspicious).
        The raw sklearn score is -1 to 1 (lower = more anomalous),
        so we invert and normalize.
    """
    model = get_model()

    features = np.array([[
        gps_jitter_variance,
        login_trigger_delta_min,
        account_age_days,
        claim_frequency_30d,
        order_rate_during_trigger,
        distance_from_centroid_km,
    ]])

    # sklearn returns: positive = normal, negative = anomalous
    raw_score = model.decision_function(features)[0]

    # Normalize to 0–1 where 1 = most suspicious
    # Typical raw scores range from -0.5 (anomaly) to 0.3 (normal)
    normalized = max(0.0, min(1.0, 0.5 - raw_score))

    return round(normalized, 4)
