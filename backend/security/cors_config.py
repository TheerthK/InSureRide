"""
InSureRide — CORS Configuration
Locks down cross-origin access to known frontend origins only.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS


def setup_cors(app: FastAPI):
    """Apply CORS middleware with strict origin allowlist."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=["Authorization", "Content-Type", "X-Device-ID", "X-Request-ID"],
        expose_headers=["X-RateLimit-Remaining", "X-RateLimit-Reset"],
        max_age=600,
    )
