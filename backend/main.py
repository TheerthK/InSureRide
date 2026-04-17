"""
InSureRide — FastAPI Main Application
Mounts all routers, applies security middleware, seeds demo data on startup.

Run with:
    uvicorn main:app --reload

Swagger UI: http://localhost:8000/docs
ReDoc:      http://localhost:8000/redoc
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from claims_engine.claim_creator import create_claims
from config import APP_NAME, APP_VERSION, DEMO_MODE
from db import create_tables, SessionLocal
from security.rate_limit import setup_rate_limiting
from security.cors_config import setup_cors

# Import routers
from auth.routes import router as auth_router
from onboarding.routes import router as onboarding_router
from fraud_detection.routes import router as fraud_router
from chatbot.routes import router as chatbot_router
from fastapi import APIRouter

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    # ── Startup ──────────────────────────────────────────────────────────
    print(f"[InSureRide] Starting {APP_NAME} v{APP_VERSION}")
    print(f"[InSureRide] Demo mode: {DEMO_MODE}")

    # Create database tables
    create_tables()
    print("[InSureRide] [OK] Database tables created")

    # Seed demo data
    from seed_data import seed_database
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    # Train fraud model if not already trained
    from fraud_detection.layer3_isolation_forest import get_model
    get_model()
    print("[InSureRide] [OK] Fraud detection model loaded")

    # Start cluster scanner background job
    from fraud_detection.layer5_cluster import start_cluster_scanner
    start_cluster_scanner()
    print("[InSureRide] [OK] Cluster scanner started")

    print("[InSureRide] [OK] Ready! Swagger UI at http://localhost:8000/docs")

    yield

    # ── Shutdown ─────────────────────────────────────────────────────────
    print("[InSureRide] Shutting down...")


# ── Create App ───────────────────────────────────────────────────────────────

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="""
# InSureRide API

AI-powered parametric income insurance for India's food-delivery riders.

## Modules (Akhilesh)

- **Auth** — OTP-based phone login + JWT tokens
- **Onboarding** — Platform linking, stats import, zone detection, UPI linking
- **Fraud Detection** — 5-layer architecture (Hard Blocks → Flock Verification → Isolation Forest → Sync-Up Gate → Cluster Detection)
- **Chatbot** — Multilingual keyword-based intent matching (6 languages, 10 intents)
- **Security** — Rate limiting, CORS lockdown, Pydantic validation, audit logging

## Demo Mode

In demo mode (`DEMO_MODE=true`, default):
- OTP accepts any 6 digits
- Rider stats are mocked
- Fraud detection uses synthetic data
- Database is seeded with sample riders

## Security (OWASP Top 10)

1. **Injection** — Parameterized queries via SQLAlchemy ORM
2. **Broken Authentication** — JWT with short-lived access tokens + refresh tokens
3. **Sensitive Data Exposure** — Aadhaar stored as SHA-256 hash, never in plaintext
4. **XML External Entities** — Not applicable (JSON-only API)
5. **Broken Access Control** — Endpoint-level auth via JWT bearer tokens
6. **Security Misconfiguration** — CORS lockdown, rate limiting, HTTPS-ready
7. **XSS** — API-only backend, no HTML rendering; admin web has CSP headers
8. **Insecure Deserialization** — Pydantic validation on all request bodies
9. **Using Components with Known Vulns** — Pinned dependency versions
10. **Insufficient Logging** — Audit log table for every important action
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── Security Middleware ──────────────────────────────────────────────────────
setup_cors(app)
setup_rate_limiting(app)

# ── Mount Routers ────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(onboarding_router)
app.include_router(fraud_router)
app.include_router(chatbot_router)


# ── Health Check ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {
        "service": APP_NAME,
        "version": APP_VERSION,
        "demo_mode": DEMO_MODE,
        "status": "healthy",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}



# ── Theerth: Trigger Routes ────────────────────────────────────────────────

from fastapi import APIRouter
from claims_engine.claim_creator import create_claims

trigger_router = APIRouter(prefix="/triggers", tags=["Triggers"])

@trigger_router.get("/test")
def test_trigger():
    return {"message": "Theerth trigger working"}

@trigger_router.post("/simulate")
def simulate_trigger():
    event = {
        "type": "HEAVY_RAIN",
        "zone": "Tambaram",
        "value": 80
    }

    create_claims(event)

    return {"message": "Trigger fired + claims created"}

# ✅ INCLUDE ROUTER AT THE VERY END
app.include_router(trigger_router)