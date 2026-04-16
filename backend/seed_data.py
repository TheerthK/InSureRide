"""
InSureRide — Demo Seed Data
Seeds the database with multiple rider personas for demo purposes.
Includes Ravi Kumar (primary persona) and 9 additional riders across Indian cities.
"""
from datetime import datetime, timedelta, date
import random
import string

from sqlalchemy.orm import Session

from models import (
    Rider, RiderStats, TrustScore, Policy, Cohort,
    TriggerEvent, Claim, Referral, AuditLog,
)


def _ref_code():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


DEMO_RIDERS = [
    {
        "phone": "+919876543210",
        "aadhaar_hash": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
        "device_fingerprint": "df_ravi_001_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
        "upi_vpa": "ravi.kumar@phonepe",
        "platform": "swiggy",
        "platform_rider_id": "SW00104729",
        "language": "ta",
        "zone_lat": 12.9249,
        "zone_lng": 80.1000,
        "zone_name": "Tambaram, Chennai",
        "referral_code": "RAVI42",
        "referred_by": None,
        "stats": {
            "star_rating": 4.6,
            "weeks_on_platform": 104,
            "avg_weekly_hours": 54,
            "total_incentives_4wk": 2400,
            "bonus_history_4wk": 800,
            "shift_consistency": 0.92,
            "earnings_consistency": 0.88,
        },
        "trust_score": 847,
        "trust_tier": "Gold",
    },
    {
        "phone": "+919876543211",
        "aadhaar_hash": "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6b2c3",
        "device_fingerprint": "df_arun_002_bcd234efg567hij890klm123nop456qrs789tuv012wxy345za",
        "upi_vpa": "arun.m@gpay",
        "platform": "zomato",
        "platform_rider_id": "ZM00283741",
        "language": "hi",
        "zone_lat": 19.1136,
        "zone_lng": 72.8697,
        "zone_name": "Andheri, Mumbai",
        "referral_code": "ARUN77",
        "referred_by": "RAVI42",
        "stats": {
            "star_rating": 4.3,
            "weeks_on_platform": 78,
            "avg_weekly_hours": 48,
            "total_incentives_4wk": 1800,
            "bonus_history_4wk": 600,
            "shift_consistency": 0.85,
            "earnings_consistency": 0.80,
        },
        "trust_score": 720,
        "trust_tier": "Gold",
    },
    {
        "phone": "+919876543212",
        "aadhaar_hash": "c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6c3d4e5",
        "device_fingerprint": "df_priya_003_cde345fgh678ijk901lmn234opq567rst890uvw123xyz456ab",
        "upi_vpa": "priya.s@paytm",
        "platform": "swiggy",
        "platform_rider_id": "SW00398521",
        "language": "kn",
        "zone_lat": 12.9352,
        "zone_lng": 77.6245,
        "zone_name": "Koramangala, Bangalore",
        "referral_code": "PRIYA9",
        "referred_by": None,
        "stats": {
            "star_rating": 4.8,
            "weeks_on_platform": 130,
            "avg_weekly_hours": 56,
            "total_incentives_4wk": 3200,
            "bonus_history_4wk": 1200,
            "shift_consistency": 0.95,
            "earnings_consistency": 0.91,
        },
        "trust_score": 920,
        "trust_tier": "Platinum",
    },
    {
        "phone": "+919876543213",
        "aadhaar_hash": "d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6d4e5f6a1",
        "device_fingerprint": "df_rajesh_004_def456ghi789jkl012mno345pqr678stu901vwx234yza567b",
        "upi_vpa": "rajesh.k@phonepe",
        "platform": "zepto",
        "platform_rider_id": "ZP00567123",
        "language": "te",
        "zone_lat": 17.4483,
        "zone_lng": 78.3915,
        "zone_name": "Madhapur, Hyderabad",
        "referral_code": "RAJSH5",
        "referred_by": "PRIYA9",
        "stats": {
            "star_rating": 4.1,
            "weeks_on_platform": 45,
            "avg_weekly_hours": 42,
            "total_incentives_4wk": 1500,
            "bonus_history_4wk": 400,
            "shift_consistency": 0.78,
            "earnings_consistency": 0.72,
        },
        "trust_score": 580,
        "trust_tier": "Silver",
    },
    {
        "phone": "+919876543214",
        "aadhaar_hash": "e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6e5f6a1b2c3",
        "device_fingerprint": "df_sunil_005_efg567hij890klm123nop456qrs789tuv012wxy345zab678c",
        "upi_vpa": "sunil.d@gpay",
        "platform": "blinkit",
        "platform_rider_id": "BL00891234",
        "language": "hi",
        "zone_lat": 28.6315,
        "zone_lng": 77.2167,
        "zone_name": "Connaught Place, Delhi",
        "referral_code": "SUNL88",
        "referred_by": None,
        "stats": {
            "star_rating": 3.9,
            "weeks_on_platform": 22,
            "avg_weekly_hours": 38,
            "total_incentives_4wk": 1200,
            "bonus_history_4wk": 300,
            "shift_consistency": 0.68,
            "earnings_consistency": 0.65,
        },
        "trust_score": 420,
        "trust_tier": "Silver",
    },
    {
        "phone": "+919876543215",
        "aadhaar_hash": "f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6",
        "device_fingerprint": "df_meena_006_fgh678ijk901lmn234opq567rst890uvw123xyz456abc789d",
        "upi_vpa": "meena.r@phonepe",
        "platform": "swiggy",
        "platform_rider_id": "SW00672345",
        "language": "ta",
        "zone_lat": 13.0418,
        "zone_lng": 80.2341,
        "zone_name": "T. Nagar, Chennai",
        "referral_code": "MEENA3",
        "referred_by": "RAVI42",
        "stats": {
            "star_rating": 4.5,
            "weeks_on_platform": 88,
            "avg_weekly_hours": 50,
            "total_incentives_4wk": 2100,
            "bonus_history_4wk": 700,
            "shift_consistency": 0.90,
            "earnings_consistency": 0.85,
        },
        "trust_score": 790,
        "trust_tier": "Gold",
    },
    {
        "phone": "+919876543216",
        "aadhaar_hash": "a1a2a3a4a5a6a1a2a3a4a5a6a1a2a3a4a5a6a1a2a3a4a5a6a1a2a3a4a5a6a1a2",
        "device_fingerprint": "df_deepak_007_ghi789jkl012mno345pqr678stu901vwx234yza567bcd890",
        "upi_vpa": "deepak.p@paytm",
        "platform": "dunzo",
        "platform_rider_id": "DN00345678",
        "language": "bn",
        "zone_lat": 22.5726,
        "zone_lng": 88.4111,
        "zone_name": "Salt Lake, Kolkata",
        "referral_code": "DEEP14",
        "referred_by": None,
        "stats": {
            "star_rating": 4.4,
            "weeks_on_platform": 62,
            "avg_weekly_hours": 45,
            "total_incentives_4wk": 1900,
            "bonus_history_4wk": 550,
            "shift_consistency": 0.86,
            "earnings_consistency": 0.82,
        },
        "trust_score": 710,
        "trust_tier": "Gold",
    },
    {
        "phone": "+919876543217",
        "aadhaar_hash": "b1b2b3b4b5b6b1b2b3b4b5b6b1b2b3b4b5b6b1b2b3b4b5b6b1b2b3b4b5b6b1b2",
        "device_fingerprint": "df_vikram_008_hij890klm123nop456qrs789tuv012wxy345zab678cde901",
        "upi_vpa": "vikram.s@gpay",
        "platform": "zomato",
        "platform_rider_id": "ZM00456789",
        "language": "hi",
        "zone_lat": 18.5074,
        "zone_lng": 73.8077,
        "zone_name": "Kothrud, Pune",
        "referral_code": "VIKR56",
        "referred_by": "ARUN77",
        "stats": {
            "star_rating": 4.7,
            "weeks_on_platform": 112,
            "avg_weekly_hours": 52,
            "total_incentives_4wk": 2800,
            "bonus_history_4wk": 1000,
            "shift_consistency": 0.93,
            "earnings_consistency": 0.89,
        },
        "trust_score": 870,
        "trust_tier": "Gold",
    },
    {
        "phone": "+919876543218",
        "aadhaar_hash": "c1c2c3c4c5c6c1c2c3c4c5c6c1c2c3c4c5c6c1c2c3c4c5c6c1c2c3c4c5c6c1c2",
        "device_fingerprint": "df_kavita_009_ijk901lmn234opq567rst890uvw123xyz456abc789def012g",
        "upi_vpa": "kavita.n@phonepe",
        "platform": "amazon",
        "platform_rider_id": "AM00789012",
        "language": "hi",
        "zone_lat": 28.5921,
        "zone_lng": 77.0460,
        "zone_name": "Dwarka, Delhi",
        "referral_code": "KAVT21",
        "referred_by": "SUNL88",
        "stats": {
            "star_rating": 4.0,
            "weeks_on_platform": 30,
            "avg_weekly_hours": 40,
            "total_incentives_4wk": 1400,
            "bonus_history_4wk": 350,
            "shift_consistency": 0.75,
            "earnings_consistency": 0.70,
        },
        "trust_score": 510,
        "trust_tier": "Silver",
    },
    {
        "phone": "+919876543219",
        "aadhaar_hash": "d1d2d3d4d5d6d1d2d3d4d5d6d1d2d3d4d5d6d1d2d3d4d5d6d1d2d3d4d5d6d1d2",
        "device_fingerprint": "df_ganesh_010_jkl012mno345pqr678stu901vwx234yza567bcd890efg123h",
        "upi_vpa": "ganesh.t@gpay",
        "platform": "swiggy",
        "platform_rider_id": "SW00890123",
        "language": "ta",
        "zone_lat": 12.9815,
        "zone_lng": 80.2180,
        "zone_name": "Velachery, Chennai",
        "referral_code": "GANS33",
        "referred_by": "RAVI42",
        "stats": {
            "star_rating": 3.8,
            "weeks_on_platform": 15,
            "avg_weekly_hours": 35,
            "total_incentives_4wk": 1000,
            "bonus_history_4wk": 200,
            "shift_consistency": 0.62,
            "earnings_consistency": 0.60,
        },
        "trust_score": 350,
        "trust_tier": "Bronze",
    },
]


# ── Cohorts ──────────────────────────────────────────────────────────────────
DEMO_COHORTS = [
    {"id": "CHN-TAM-EVE-BIKE", "centroid_lat": 12.9249, "centroid_lng": 80.1000, "shift_window": "evening", "vehicle_type": "bike", "active_policies": 85, "loss_ratio": 0.71},
    {"id": "MUM-AND-MOR-BIKE", "centroid_lat": 19.1136, "centroid_lng": 72.8697, "shift_window": "morning", "vehicle_type": "bike", "active_policies": 120, "loss_ratio": 0.65},
    {"id": "BLR-KOR-EVE-BIKE", "centroid_lat": 12.9352, "centroid_lng": 77.6245, "shift_window": "evening", "vehicle_type": "bike", "active_policies": 95, "loss_ratio": 0.58},
    {"id": "HYD-MAD-AFT-BIKE", "centroid_lat": 17.4483, "centroid_lng": 78.3915, "shift_window": "afternoon", "vehicle_type": "bike", "active_policies": 60, "loss_ratio": 0.72},
    {"id": "DEL-CNP-MOR-BIKE", "centroid_lat": 28.6315, "centroid_lng": 77.2167, "shift_window": "morning", "vehicle_type": "bike", "active_policies": 200, "loss_ratio": 0.68},
    {"id": "KOL-SLK-EVE-BIKE", "centroid_lat": 22.5726, "centroid_lng": 88.4111, "shift_window": "evening", "vehicle_type": "bike", "active_policies": 45, "loss_ratio": 0.75},
    {"id": "PUN-KOT-AFT-BIKE", "centroid_lat": 18.5074, "centroid_lng": 73.8077, "shift_window": "afternoon", "vehicle_type": "bike", "active_policies": 70, "loss_ratio": 0.62},
]


def seed_database(db: Session):
    """
    Seed the database with demo data.
    Idempotent — skips if data already exists.
    """
    # Check if already seeded
    existing = db.query(Rider).count()
    if existing > 0:
        print(f"[Seed] Database already has {existing} riders. Skipping seed.")
        return

    print("[Seed] Seeding database with demo data...")

    now = datetime.utcnow()

    # ── Cohorts ──────────────────────────────────────────────────────────
    for c in DEMO_COHORTS:
        cohort = Cohort(
            id=c["id"],
            centroid_lat=c["centroid_lat"],
            centroid_lng=c["centroid_lng"],
            shift_window=c["shift_window"],
            vehicle_type=c["vehicle_type"],
            active_policies=c["active_policies"],
            loss_ratio=c["loss_ratio"],
            recomputed_at=now,
        )
        db.add(cohort)
    db.commit()

    # ── Riders + Stats + Trust Scores + Policies ─────────────────────────
    for i, rd in enumerate(DEMO_RIDERS):
        rider = Rider(
            phone=rd["phone"],
            aadhaar_hash=rd["aadhaar_hash"],
            device_fingerprint=rd["device_fingerprint"],
            upi_vpa=rd["upi_vpa"],
            platform=rd["platform"],
            platform_rider_id=rd["platform_rider_id"],
            language=rd["language"],
            zone_lat=rd["zone_lat"],
            zone_lng=rd["zone_lng"],
            zone_name=rd["zone_name"],
            referral_code=rd["referral_code"],
            referred_by=rd["referred_by"],
            created_at=now - timedelta(days=rd["stats"]["weeks_on_platform"] * 7),
        )
        db.add(rider)
        db.commit()
        db.refresh(rider)

        # Stats
        stats = RiderStats(rider_id=rider.id, **rd["stats"], updated_at=now)
        db.add(stats)

        # Trust Score
        ts = TrustScore(
            rider_id=rider.id,
            score=rd["trust_score"],
            tier=rd["trust_tier"],
            computed_at=now,
        )
        db.add(ts)

        # Active Policy
        this_monday = now.date() - timedelta(days=now.weekday())
        this_sunday = this_monday + timedelta(days=6)
        policy = Policy(
            rider_id=rider.id,
            week_start=this_monday,
            week_end=this_sunday,
            premium_paid=78.0 if rd["trust_tier"] in ("Gold", "Platinum") else 95.0,
            cohort_id=DEMO_COHORTS[i % len(DEMO_COHORTS)]["id"],
            status="ACTIVE",
            created_at=now - timedelta(hours=random.randint(1, 48)),
        )
        db.add(policy)

    db.commit()

    # ── Sample Trigger Events ────────────────────────────────────────────
    trigger_events = [
        TriggerEvent(
            trigger_type="heavy_rain",
            zone_lat=12.9249, zone_lng=80.1000, radius_km=3.0,
            threshold_value=78.5,
            fired_at=now - timedelta(hours=6),
            data_source="OpenWeather",
            raw_evidence='{"rainfall_mm": 78.5, "duration_hours": 5, "station": "Tambaram"}',
        ),
        TriggerEvent(
            trigger_type="platform_outage",
            zone_lat=19.1136, zone_lng=72.8697, radius_km=10.0,
            threshold_value=45.0,
            fired_at=now - timedelta(hours=12),
            data_source="status_page_mock",
            raw_evidence='{"platform": "swiggy", "outage_minutes": 45, "affected_zones": ["Andheri", "Bandra"]}',
        ),
        TriggerEvent(
            trigger_type="extreme_heat",
            zone_lat=28.6315, zone_lng=77.2167, radius_km=5.0,
            threshold_value=44.2,
            fired_at=now - timedelta(hours=24),
            data_source="OpenWeather",
            raw_evidence='{"temperature_c": 44.2, "duration_hours": 4, "station": "Connaught Place"}',
        ),
    ]
    db.add_all(trigger_events)
    db.commit()

    # ── Sample Claims (for Ravi) ─────────────────────────────────────────
    ravi = db.query(Rider).filter(Rider.phone == "+919876543210").first()
    ravi_policy = db.query(Policy).filter(Policy.rider_id == ravi.id).first()
    trigger_rain = db.query(TriggerEvent).filter(TriggerEvent.trigger_type == "heavy_rain").first()

    claim = Claim(
        rider_id=ravi.id,
        policy_id=ravi_policy.id,
        trigger_event_id=trigger_rain.id,
        amount=600.0,
        status="PAID",
        fraud_score=0.18,
        fraud_flags='[{"layer": "layer2_flock", "result": "PASS", "details": "4/80 working, 76 stopped — real disruption"}]',
        created_at=now - timedelta(hours=5),
        paid_at=now - timedelta(hours=4),
        payout_ref="PAY-RS47291",
        claim_lat=12.9249,
        claim_lng=80.1000,
        pin_code="600045",
    )
    db.add(claim)

    # ── Sample Referrals ─────────────────────────────────────────────────
    arun = db.query(Rider).filter(Rider.phone == "+919876543211").first()
    meena = db.query(Rider).filter(Rider.phone == "+919876543215").first()
    ganesh = db.query(Rider).filter(Rider.phone == "+919876543219").first()

    for referee in [arun, meena, ganesh]:
        ref = Referral(
            referrer_code="RAVI42",
            referee_id=referee.id,
            status="ACTIVATED",
            credit_applied=True,
            created_at=referee.created_at + timedelta(hours=1),
        )
        db.add(ref)

    # ── Audit Log Entries ────────────────────────────────────────────────
    audit_entries = [
        AuditLog(actor_type="SYSTEM", actor_id="scheduler", action="trigger_fired",
                 payload_summary="Heavy rain trigger fired in Tambaram, Chennai", timestamp=now - timedelta(hours=6)),
        AuditLog(actor_type="SYSTEM", actor_id="fraud_engine", action="claim_scored",
                 payload_summary="Claim #1 scored 0.18 — APPROVED", timestamp=now - timedelta(hours=5, minutes=30)),
        AuditLog(actor_type="SYSTEM", actor_id="payout_engine", action="payout_disbursed",
                 payload_summary="₹600 paid to ravi.kumar@phonepe via Razorpay", timestamp=now - timedelta(hours=4)),
        AuditLog(actor_type="RIDER", actor_id="1", action="otp_verified",
                 payload_summary="Ravi Kumar logged in", timestamp=now - timedelta(days=1)),
    ]
    db.add_all(audit_entries)

    db.commit()

    rider_count = db.query(Rider).count()
    policy_count = db.query(Policy).count()
    print(f"[Seed] Done. Seeded {rider_count} riders, {policy_count} policies, "
          f"{len(trigger_events)} trigger events, sample claims + referrals + audit log.")
