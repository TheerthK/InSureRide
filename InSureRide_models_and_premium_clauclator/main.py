"""FastAPI application entry point.

Mounts the routers owned by each backend module. Other contributors add
their routers by following the same `include_router` pattern.

Run:
    uvicorn main:app --reload --port 8000
Swagger UI: http://localhost:8000/docs
"""
from __future__ import annotations

from fastapi import FastAPI

from cohort_pricing.routes import router as cohort_router
from db import init_db
from premium_engine.routes import router as premium_router
from referral.routes import router as referral_router
from rider_score.routes import router as rider_score_router

app = FastAPI(
    title="InSureRide API",
    version="0.1.0",
    description="Parametric income insurance for gig delivery riders.",
)


@app.on_event("startup")
def _startup() -> None:
    init_db()


@app.get("/health", tags=["system"])
def health() -> dict:
    return {"status": "ok"}


app.include_router(premium_router)
app.include_router(rider_score_router)
app.include_router(cohort_router)
app.include_router(referral_router)
