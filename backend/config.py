"""
InSureRide — Central Configuration
Environment variables with sensible defaults for demo mode.
"""
import os


# ── General ──────────────────────────────────────────────────────────────────
DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"
APP_NAME: str = "InSureRide API"
APP_VERSION: str = "1.0.0"

# ── Database ─────────────────────────────────────────────────────────────────
DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./insureride.db")

# ── JWT / Auth ───────────────────────────────────────────────────────────────
SECRET_KEY: str = os.getenv("SECRET_KEY", "insureride-demo-secret-key-change-in-prod")
JWT_ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = 60          # 1 hour
REFRESH_TOKEN_EXPIRE_DAYS: int = 30            # 30 days
OTP_TTL_SECONDS: int = 300                     # 5 minutes

# ── Rate Limiting ────────────────────────────────────────────────────────────
RATE_LIMIT_GENERAL: str = "60/minute"          # 60 req/min per IP
RATE_LIMIT_AUTH: str = "10/minute"             # 10 req/min on /auth/*

# ── CORS ─────────────────────────────────────────────────────────────────────
CORS_ORIGINS: list[str] = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://localhost:8081"
).split(",")

# ── Fraud Detection ─────────────────────────────────────────────────────────
FLOCK_RADIUS_KM: float = 1.0
FLOCK_MIN_NEARBY: int = 10
FLOCK_HIGH_WORKING_RATIO: float = 0.6
FLOCK_MEDIUM_WORKING_RATIO: float = 0.3
ISOLATION_FOREST_CONTAMINATION: float = 0.05
CLUSTER_SCAN_INTERVAL_SECONDS: int = 60
CLUSTER_WINDOW_SECONDS: int = 90
CLUSTER_MIN_SIZE: int = 15

# ── Fraud Score Thresholds ───────────────────────────────────────────────────
FRAUD_AUTO_APPROVE_THRESHOLD: float = 0.6
FRAUD_SYNCUP_THRESHOLD: float = 0.9  # 0.6–0.9 = syncup, >0.9 = reject

# ── Paths ────────────────────────────────────────────────────────────────────
MODELS_DIR: str = os.path.join(os.path.dirname(__file__), "models")
TEMPLATES_DIR: str = os.path.join(os.path.dirname(__file__), "templates")
DATA_DIR: str = os.path.join(os.path.dirname(__file__), "data")
