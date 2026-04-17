"""Train the Keras premium model.

Architecture (from §7.2):
    Input(12) -> Dense(32, relu) -> Dropout(0.2) -> Dense(16, relu) -> Dense(1, sigmoid)

Output is a 0-1 risk score. We scale the label to [0,1] during training
and invert at prediction time.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from premium_engine import FEATURE_COLUMNS, MAX_CAP, MIN_FLOOR  # noqa: E402
from premium_engine.gen_synthetic import generate  # noqa: E402

MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "premium_model.h5"
META_PATH = Path(__file__).resolve().parents[1] / "models" / "premium_meta.json"


def _normalize_features(X: pd.DataFrame) -> tuple[np.ndarray, dict]:
    means = X.mean().to_dict()
    stds = X.std().replace(0, 1.0).to_dict()
    Xn = (X - pd.Series(means)) / pd.Series(stds)
    return Xn.values.astype(np.float32), {"means": means, "stds": stds}


def train(epochs: int = 50, batch_size: int = 64) -> None:
    from tensorflow import keras  # imported lazily so the package is optional at import time
    from tensorflow.keras import layers

    df = generate()
    X = df[FEATURE_COLUMNS]
    y = ((df["premium"] - MIN_FLOOR) / (MAX_CAP - MIN_FLOOR)).values.astype(np.float32)

    Xn, norm = _normalize_features(X)

    model = keras.Sequential(
        [
            keras.Input(shape=(len(FEATURE_COLUMNS),)),
            layers.Dense(32, activation="relu"),
            layers.Dropout(0.2),
            layers.Dense(16, activation="relu"),
            layers.Dense(1, activation="sigmoid"),
        ]
    )
    model.compile(optimizer="adam", loss="mse", metrics=["mae"])
    history = model.fit(
        Xn, y, epochs=epochs, batch_size=batch_size, validation_split=0.2, verbose=2
    )

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    model.save(MODEL_PATH)

    META_PATH.write_text(
        json.dumps(
            {
                "feature_columns": FEATURE_COLUMNS,
                "normalization": norm,
                "min_floor": MIN_FLOOR,
                "max_cap": MAX_CAP,
                "final_val_mae": float(history.history["val_mae"][-1]),
            },
            indent=2,
        )
    )
    print(f"Model saved to {MODEL_PATH}")
    print(f"Meta saved to  {META_PATH}")


if __name__ == "__main__":
    train(epochs=int(os.getenv("EPOCHS", "50")))
