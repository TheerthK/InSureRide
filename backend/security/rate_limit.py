"""
InSureRide — Rate Limiting Middleware
Uses slowapi to enforce per-IP request limits.
- 60 req/min general
- 10 req/min on /auth/* endpoints
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from config import RATE_LIMIT_GENERAL, RATE_LIMIT_AUTH

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[RATE_LIMIT_GENERAL],
)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Custom 429 response."""
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "message": f"Too many requests. Limit: {exc.detail}",
        },
    )


def setup_rate_limiting(app: FastAPI):
    """Attach rate limiter to the FastAPI app."""
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
