"""
InSureRide — Platform Link Service
Accepts platform + rider_id, returns believable mock stats.
Stores stats into the rider_stats table.
"""
import random
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from models import Rider, RiderStats


# ── Mock stat generators ─────────────────────────────────────────────────────
# Generates realistic rider stats based on rider_id hash for consistency

def _seed_from_rider_id(rider_id: str) -> int:
    """Deterministic seed so the same rider_id always gets same stats."""
    return sum(ord(c) for c in rider_id) % 10000


def generate_mock_stats(platform: str, rider_id: str) -> dict:
    """
    Generate believable rider stats.
    Uses a deterministic seed from rider_id so repeated calls return the same data.
    """
    rng = random.Random(_seed_from_rider_id(rider_id))

    star_rating = round(rng.uniform(3.5, 4.9), 1)
    weeks = rng.randint(8, 156)  # 2 months to 3 years
    hours = round(rng.uniform(25, 60), 1)
    incentives = round(rng.uniform(800, 4000), 0)
    bonus = round(rng.uniform(200, 1500), 0)
    shift_consistency = round(rng.uniform(0.60, 0.98), 2)
    earnings_consistency = round(rng.uniform(0.55, 0.95), 2)

    return {
        "star_rating": star_rating,
        "weeks_on_platform": weeks,
        "avg_weekly_hours": hours,
        "total_incentives_4wk": incentives,
        "bonus_history_4wk": bonus,
        "shift_consistency": shift_consistency,
        "earnings_consistency": earnings_consistency,
    }


def link_platform(
    db: Session,
    rider_id_db: int,
    platform: str,
    platform_rider_id: str,
) -> dict:
    """
    Link a delivery platform to the rider and import stats.
    """
    # Update rider record
    rider = db.query(Rider).filter(Rider.id == rider_id_db).first()
    if rider is None:
        raise ValueError("Rider not found")

    rider.platform = platform
    rider.platform_rider_id = platform_rider_id

    # Generate and store stats
    stats_data = generate_mock_stats(platform, platform_rider_id)

    existing_stats = db.query(RiderStats).filter(RiderStats.rider_id == rider_id_db).first()
    if existing_stats:
        for key, val in stats_data.items():
            setattr(existing_stats, key, val)
        existing_stats.updated_at = datetime.utcnow()
    else:
        new_stats = RiderStats(rider_id=rider_id_db, **stats_data)
        db.add(new_stats)

    db.commit()
    return stats_data


def get_rider_stats(platform: str, platform_rider_id: str) -> dict:
    """
    Fetch rider stats for a given platform + rider_id.
    Returns mock data (in production this would call the platform API).
    """
    return generate_mock_stats(platform, platform_rider_id)
