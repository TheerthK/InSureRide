"""
InSureRide — Fraud Layer 2: Flock Verification
THE differentiator. Spatial anomaly detection.

Algorithm:
    If a claim fires from a zone but 50+ other insured riders within 1 km
    are completing deliveries normally during the same window, the claim is
    auto-flagged.  Fraud rings can fake one rider's GPS, but they cannot
    fake the absence of 50 others who are visibly working.
"""
import math
import random
from dataclasses import dataclass
from enum import Enum

from sqlalchemy.orm import Session

from models import Rider, Policy, Claim
from config import (
    FLOCK_RADIUS_KM,
    FLOCK_MIN_NEARBY,
    FLOCK_HIGH_WORKING_RATIO,
    FLOCK_MEDIUM_WORKING_RATIO,
    DEMO_MODE,
)


class FlockDecision(str, Enum):
    PASS = "PASS"
    FLAG_MEDIUM = "FLAG_MEDIUM"
    FLAG_HIGH = "FLAG_HIGH"
    SKIPPED = "SKIPPED"        # sparse area — too few riders to judge


@dataclass
class FlockResult:
    decision: FlockDecision
    nearby_count: int = 0
    working_count: int = 0
    working_ratio: float = 0.0
    detail: str = ""


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Haversine distance between two lat/lng points in kilometres."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _query_nearby_riders(
    db: Session,
    center_lat: float,
    center_lng: float,
    radius_km: float,
    exclude_rider_id: int,
) -> list[Rider]:
    """
    Find all riders with active policies within `radius_km` of the claim location.
    Uses Haversine in Python (SQLite doesn't have spatial functions).
    """
    # Get all riders with active policies
    active_riders = (
        db.query(Rider)
        .join(Policy)
        .filter(Policy.status == "ACTIVE")
        .filter(Rider.id != exclude_rider_id)
        .filter(Rider.zone_lat.isnot(None))
        .filter(Rider.zone_lng.isnot(None))
        .all()
    )

    # Filter by distance
    nearby = []
    for rider in active_riders:
        dist = haversine_km(center_lat, center_lng, rider.zone_lat, rider.zone_lng)
        if dist <= radius_km:
            nearby.append(rider)

    return nearby


def _simulate_working_status(rider: Rider) -> bool:
    """
    In demo mode, simulate whether a nearby rider is currently working.
    In production, this would query the platform API for real-time status.

    Returns True if the rider is actively delivering (GPS moving, receiving orders).
    """
    if DEMO_MODE:
        # Default: ~25% are working during a disruption (realistic for bad weather)
        return random.random() < 0.25
    # Production: query platform API
    return False


def flock_verify(
    db: Session,
    claim_rider_id: int,
    claim_lat: float,
    claim_lng: float,
) -> FlockResult:
    """
    Flock Verification — the core fraud detection algorithm.

    1. Find all OTHER active policies within 1 km of the claim location.
    2. If fewer than 10 nearby → sparse area, skip flock check.
    3. Count how many nearby riders are working normally.
    4. If >60% are working → this claim is suspicious (FLAG_HIGH).
    5. If >30% are working → moderate suspicion (FLAG_MEDIUM).
    6. Otherwise → real disruption, claim is legit (PASS).
    """
    nearby = _query_nearby_riders(
        db, claim_lat, claim_lng, FLOCK_RADIUS_KM, claim_rider_id
    )
    nearby_count = len(nearby)

    if nearby_count < FLOCK_MIN_NEARBY:
        return FlockResult(
            decision=FlockDecision.SKIPPED,
            nearby_count=nearby_count,
            detail=f"Sparse area: only {nearby_count} nearby riders (min {FLOCK_MIN_NEARBY}). Skipping flock check.",
        )

    working_count = sum(1 for r in nearby if _simulate_working_status(r))
    working_ratio = working_count / nearby_count

    if working_ratio > FLOCK_HIGH_WORKING_RATIO:
        decision = FlockDecision.FLAG_HIGH
        detail = (
            f"HIGH SUSPICION: {working_count}/{nearby_count} ({working_ratio:.0%}) "
            f"nearby riders are working normally while this rider claims disruption."
        )
    elif working_ratio > FLOCK_MEDIUM_WORKING_RATIO:
        decision = FlockDecision.FLAG_MEDIUM
        detail = (
            f"MODERATE SUSPICION: {working_count}/{nearby_count} ({working_ratio:.0%}) "
            f"nearby riders are working during claimed disruption."
        )
    else:
        decision = FlockDecision.PASS
        detail = (
            f"PASS: Only {working_count}/{nearby_count} ({working_ratio:.0%}) "
            f"nearby riders working — confirms real disruption in zone."
        )

    return FlockResult(
        decision=decision,
        nearby_count=nearby_count,
        working_count=working_count,
        working_ratio=working_ratio,
        detail=detail,
    )
