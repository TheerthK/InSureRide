"""Seed the demo database with Ravi Kumar + supporting cohort neighbours."""
from __future__ import annotations

from datetime import datetime

from db import Cohort, Rider, RiderStats, SessionLocal, init_db
from referral.code_gen import generate_code

RAVI = {
    "id": 1,
    "phone": "+919000000001",
    "platform": "swiggy",
    "platform_rider_id": "SWG-CHN-00471",
    "language": "ta",
    "zone_lat": 12.9249,
    "zone_lng": 80.1000,
    "zone_name": "Tambaram, Chennai",
}

RAVI_STATS = {
    "star_rating": 4.6,
    "weeks_on_platform": 104,
    "avg_weekly_hours": 54.0,
    "total_incentives_4wk": 2400.0,
    "bonus_history_4wk": 800.0,
    "shift_consistency": 0.92,
    "earnings_consistency": 0.85,
}


def seed() -> None:
    init_db()
    db = SessionLocal()
    try:
        if db.get(Rider, RAVI["id"]) is None:
            rider = Rider(**RAVI, created_at=datetime.utcnow())
            rider.referral_code = generate_code(db)
            db.add(rider)
            db.flush()
            db.add(RiderStats(rider_id=rider.id, **RAVI_STATS, updated_at=datetime.utcnow()))

        if db.get(Cohort, "CHN-TAM-EVE-BIKE") is None:
            db.add(
                Cohort(
                    id="CHN-TAM-EVE-BIKE",
                    centroid_lat=12.9249,
                    centroid_lng=80.1000,
                    shift_window="evening",
                    vehicle_type="bike",
                    active_policies=220,
                    loss_ratio=0.62,
                    recent_payouts=42_000.0,
                    recomputed_at=datetime.utcnow(),
                )
            )

        db.commit()
        ravi = db.get(Rider, RAVI["id"])
        print(f"Seeded Ravi (id={ravi.id}, code={ravi.referral_code}).")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
