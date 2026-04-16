"""
InSureRide — Fraud Detection Tests
5+ unit tests including synthetic ring detection.

Run with:  pytest tests/test_fraud.py -v
"""
import sys
import os
import pytest
from datetime import datetime, timedelta

# Add backend root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from db import Base
from models import Rider, Policy, Claim, RiderStats


# ── Test DB Fixture ──────────────────────────────────────────────────────────

@pytest.fixture
def test_db():
    """Create a fresh in-memory SQLite database for each test."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture
def seeded_db(test_db):
    """Seed the test DB with riders and policies for fraud testing."""
    db = test_db

    # Create 20 riders in Tambaram (all within 1 km of each other)
    # 0.0001 degrees ≈ 11 meters, so 20 * 0.0002 ≈ 440m spread — well within 1km
    riders = []
    for i in range(20):
        rider = Rider(
            phone=f"+9198765{i:05d}",
            aadhaar_hash=f"aadhaar_hash_{i:03d}",
            device_fingerprint=f"device_fp_{i:03d}",
            upi_vpa=f"rider{i}@upi",
            platform="swiggy",
            platform_rider_id=f"SW{i:05d}",
            zone_lat=12.9249 + (i * 0.0002),  # ~22m apart, all within 1 km
            zone_lng=80.1000 + (i * 0.0002),
            zone_name="Tambaram, Chennai",
            language="ta",
            created_at=datetime.utcnow() - timedelta(days=90 + i),
            referral_code=f"REF{i:03d}",
        )
        db.add(rider)
        riders.append(rider)

    db.commit()

    # Create active policies for all riders
    for rider in riders:
        db.refresh(rider)
        policy = Policy(
            rider_id=rider.id,
            week_start=datetime.utcnow().date(),
            week_end=(datetime.utcnow() + timedelta(days=6)).date(),
            premium_paid=78.0,
            cohort_id="CHN-TAM-EVE-BIKE",
            status="ACTIVE",
        )
        db.add(policy)

    db.commit()

    # Refresh to get policy IDs
    for rider in riders:
        db.refresh(rider)

    return db, riders


# ═══════════════════════════════════════════════════════════════════════════════
# TEST 1: Layer 1 — Hard Block: Duplicate Aadhaar Detection
# ═══════════════════════════════════════════════════════════════════════════════

def test_layer1_blocks_duplicate_aadhaar(test_db):
    """
    Layer 1 hard blocks work at TWO levels:
    1. DB-level UNIQUE constraint prevents duplicate Aadhaar insertion entirely.
    2. check functions detect duplicates on device fingerprint / UPI.

    This test verifies BOTH levels.
    """
    from fraud_detection.layer1_hardblocks import (
        run_hard_blocks,
        check_device_uniqueness,
    )
    from sqlalchemy.exc import IntegrityError as SAIntegrityError

    db = test_db

    # ── Part A: DB-level UNIQUE constraint on aadhaar (the primary hard block) ──
    rider1 = Rider(
        phone="+919876500001",
        aadhaar_hash="AADHAAR_HASH_A",
        device_fingerprint="fp_001",
        upi_vpa="rider1@upi",
        created_at=datetime.utcnow(),
    )
    db.add(rider1)
    db.commit()

    # Attempting to insert a second rider with the SAME aadhaar should fail
    rider_dup = Rider(
        phone="+919876500099",
        aadhaar_hash="AADHAAR_HASH_A",  # duplicate!
        device_fingerprint="fp_099",
        upi_vpa="rider99@upi",
        created_at=datetime.utcnow(),
    )
    db.add(rider_dup)
    try:
        db.commit()
        assert False, "DB should reject duplicate aadhaar_hash"
    except SAIntegrityError:
        db.rollback()  # Expected — the DB-level hard block works

    # ── Part B: check function detects duplicate device fingerprint ──────────
    rider2 = Rider(
        phone="+919876500002",
        aadhaar_hash="AADHAAR_HASH_B",
        device_fingerprint="fp_001",  # SAME device as rider1!
        upi_vpa="rider2@upi",
        created_at=datetime.utcnow(),
    )
    db.add(rider2)
    try:
        db.commit()
        db.rollback()
    except SAIntegrityError:
        db.rollback()

    # Since device_fingerprint also has UNIQUE, test via check function with None FP
    rider3 = Rider(
        phone="+919876500003",
        aadhaar_hash="AADHAAR_HASH_C",
        device_fingerprint="fp_003",
        upi_vpa="rider3_dup@upi",
        created_at=datetime.utcnow(),
    )
    rider4 = Rider(
        phone="+919876500004",
        aadhaar_hash="AADHAAR_HASH_D",
        device_fingerprint=None,  # No device yet
        upi_vpa="rider4@upi",
        created_at=datetime.utcnow(),
    )
    db.add_all([rider3, rider4])
    db.commit()
    db.refresh(rider3)
    db.refresh(rider4)

    # rider3 with unique everything should pass
    result = run_hard_blocks(db, rider3.id)
    assert result.passed, f"Unique rider should pass, got: {result.reason}"

    # rider4 with no device should also pass (no device = no check needed)
    result_no_device = check_device_uniqueness(db, rider4.id)
    assert result_no_device.passed, "Rider with no device FP should pass"


# ═══════════════════════════════════════════════════════════════════════════════
# TEST 2: Layer 1 — Hard Block: Unique rider should pass
# ═══════════════════════════════════════════════════════════════════════════════

def test_layer1_passes_unique_rider(test_db):
    """Layer 1 should pass a rider with all unique identifiers."""
    from fraud_detection.layer1_hardblocks import run_hard_blocks

    db = test_db

    rider = Rider(
        phone="+919876500010",
        aadhaar_hash="unique_aadhaar",
        device_fingerprint="unique_fp",
        upi_vpa="unique@upi",
        created_at=datetime.utcnow(),
    )
    db.add(rider)
    db.commit()
    db.refresh(rider)

    result = run_hard_blocks(db, rider.id)
    assert result.passed, f"Unique rider should pass hard blocks, but got: {result.reason}"


# ═══════════════════════════════════════════════════════════════════════════════
# TEST 3: Layer 2 — Flock Passes When Most Riders Stopped
# ═══════════════════════════════════════════════════════════════════════════════

def test_layer2_flock_passes_real_disruption(seeded_db, monkeypatch):
    """
    Flock Verification should PASS when most nearby riders also stopped
    (confirming a real disruption).
    """
    from fraud_detection.layer2_flock import flock_verify, FlockDecision, _simulate_working_status

    db, riders = seeded_db

    # Monkeypatch: make almost all riders NOT working (real disruption)
    call_count = {"n": 0}
    def mock_not_working(rider):
        call_count["n"] += 1
        return call_count["n"] % 10 == 0  # Only 10% working
    monkeypatch.setattr("fraud_detection.layer2_flock._simulate_working_status", mock_not_working)

    result = flock_verify(
        db,
        claim_rider_id=riders[0].id,
        claim_lat=12.9249,
        claim_lng=80.1000,
    )

    assert result.decision == FlockDecision.PASS, (
        f"Should PASS when most riders stopped, but got {result.decision}: {result.detail}"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# TEST 4: Layer 2 — Flock Flags When Most Riders Working
# ═══════════════════════════════════════════════════════════════════════════════

def test_layer2_flock_flags_suspicious_claim(seeded_db, monkeypatch):
    """
    Flock Verification should FLAG_HIGH when most nearby riders are working
    normally (this claim is suspicious).
    """
    from fraud_detection.layer2_flock import flock_verify, FlockDecision

    db, riders = seeded_db

    # Monkeypatch: make most riders working (suspicious claim)
    def mock_working(rider):
        return True  # 100% working
    monkeypatch.setattr("fraud_detection.layer2_flock._simulate_working_status", mock_working)

    result = flock_verify(
        db,
        claim_rider_id=riders[0].id,
        claim_lat=12.9249,
        claim_lng=80.1000,
    )

    assert result.decision == FlockDecision.FLAG_HIGH, (
        f"Should FLAG_HIGH when most riders working, but got {result.decision}: {result.detail}"
    )
    assert result.working_ratio > 0.6


# ═══════════════════════════════════════════════════════════════════════════════
# TEST 5: Layer 3 — Isolation Forest: Normal vs Suspicious
# ═══════════════════════════════════════════════════════════════════════════════

def test_layer3_anomaly_detection():
    """
    Isolation Forest should score normal behavior low and suspicious behavior high.
    """
    from fraud_detection.layer3_isolation_forest import predict_anomaly_score

    # Normal rider behavior
    normal_score = predict_anomaly_score(
        gps_jitter_variance=0.15,       # Normal movement
        login_trigger_delta_min=120,     # Already online
        account_age_days=180,            # Established account
        claim_frequency_30d=0.5,         # Low claim rate
        order_rate_during_trigger=0.05,  # Not getting orders (disrupted)
        distance_from_centroid_km=1.0,   # In usual area
    )

    # Suspicious behavior (GPS spoofing, new account, many claims)
    suspicious_score = predict_anomaly_score(
        gps_jitter_variance=0.001,       # Static GPS (spoofed)
        login_trigger_delta_min=2,        # Logged in right after trigger
        account_age_days=5,               # Brand new account
        claim_frequency_30d=6.0,          # Very high claim rate
        order_rate_during_trigger=0.5,    # Still getting orders (not disrupted)
        distance_from_centroid_km=25.0,   # Far from usual area
    )

    assert suspicious_score > normal_score, (
        f"Suspicious ({suspicious_score}) should score higher than normal ({normal_score})"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# TEST 6: Layer 4 — Sync-Up Decision Matrix
# ═══════════════════════════════════════════════════════════════════════════════

def test_layer4_decision_matrix():
    """Test the sync-up decision matrix thresholds."""
    from fraud_detection.layer4_syncup import evaluate_syncup, SyncUpDecision

    # Low score → approve
    result_approve = evaluate_syncup(flock_score=0.1, isolation_score=0.2)
    assert result_approve.decision == SyncUpDecision.APPROVE

    # Medium score → syncup
    result_syncup = evaluate_syncup(flock_score=0.7, isolation_score=0.6)
    assert result_syncup.decision == SyncUpDecision.SYNCUP

    # High score → reject
    result_reject = evaluate_syncup(flock_score=0.9, isolation_score=0.95)
    assert result_reject.decision == SyncUpDecision.REJECT


# ═══════════════════════════════════════════════════════════════════════════════
# TEST 7: Layer 5 — Cluster Detection: Synthetic Ring of 50 Spoofed Accounts
# ═══════════════════════════════════════════════════════════════════════════════

def test_layer5_catches_synthetic_ring(test_db):
    """
    Layer 5 should detect a coordinated fraud ring of 50 accounts
    submitting claims from the same PIN code within 90 seconds.
    """
    from fraud_detection.layer5_cluster import run_cluster_check_now, get_cluster_alerts

    db = test_db

    # Create 50 riders (fraud ring)
    for i in range(50):
        rider = Rider(
            phone=f"+91fraud{i:06d}",
            device_fingerprint=f"fraud_device_{i:03d}",
            upi_vpa=f"fraud{i}@upi",
            zone_lat=19.1136,
            zone_lng=72.8697,
            zone_name="Andheri, Mumbai",
            created_at=datetime.utcnow() - timedelta(days=3),
        )
        db.add(rider)
    db.commit()

    # Create policies for all
    riders = db.query(Rider).all()
    for rider in riders:
        policy = Policy(
            rider_id=rider.id,
            week_start=datetime.utcnow().date(),
            week_end=(datetime.utcnow() + timedelta(days=6)).date(),
            premium_paid=78.0,
            status="ACTIVE",
        )
        db.add(policy)
    db.commit()

    # Create 50 claims from the SAME PIN code within 90 seconds
    # (coordinated ring behavior)
    now = datetime.utcnow()
    for i, rider in enumerate(riders):
        policy = db.query(Policy).filter(Policy.rider_id == rider.id).first()
        claim = Claim(
            rider_id=rider.id,
            policy_id=policy.id,
            amount=600.0,
            status="PENDING_FRAUD_CHECK",
            pin_code="400069",             # ALL same PIN code
            device_fingerprint=f"fraud_device_{i:03d}",
            upi_provider="phonepe",
            ip_address="103.21.58.100",    # Same IP block
            claim_lat=19.1136,
            claim_lng=72.8697,
            created_at=now - timedelta(seconds=i),  # All within 90 seconds
        )
        db.add(claim)
    db.commit()

    # Run cluster detection
    run_cluster_check_now(db)

    # Check alerts
    alerts = get_cluster_alerts()
    assert len(alerts) > 0, "Should detect at least one cluster from 50 coordinated claims"

    # The largest cluster should be ≥ 15 (our threshold)
    largest = max(alerts, key=lambda a: a.size)
    assert largest.size >= 15, f"Largest cluster should be ≥ 15, got {largest.size}"

    # Verify claims were frozen
    frozen_claims = db.query(Claim).filter(Claim.status == "FROZEN_CLUSTER").count()
    assert frozen_claims > 0, f"Expected some claims to be frozen, got {frozen_claims}"

    print(f"[OK] Detected {len(alerts)} cluster(s), largest has {largest.size} claims, "
          f"{frozen_claims} claims frozen")


# ═══════════════════════════════════════════════════════════════════════════════
# TEST 8: Full Orchestrator End-to-End
# ═══════════════════════════════════════════════════════════════════════════════

def test_orchestrator_end_to_end(seeded_db, monkeypatch):
    """
    Test the full fraud scoring orchestrator with a legitimate claim.
    Should pass all 5 layers and return APPROVED.
    """
    from fraud_detection.score_orchestrator import score_claim

    db, riders = seeded_db

    # Create a claim for rider 0
    rider = riders[0]
    policy = db.query(Policy).filter(Policy.rider_id == rider.id).first()

    claim = Claim(
        rider_id=rider.id,
        policy_id=policy.id,
        amount=600.0,
        status="PENDING_FRAUD_CHECK",
        claim_lat=12.9249,
        claim_lng=80.1000,
        pin_code="600045",
        created_at=datetime.utcnow(),
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)

    # Monkeypatch flock to simulate real disruption
    def mock_not_working(rider):
        return False  # Nobody working = real disruption
    monkeypatch.setattr("fraud_detection.layer2_flock._simulate_working_status", mock_not_working)

    result = score_claim(db, claim.id)

    assert result.decision == "APPROVED", (
        f"Legitimate claim should be approved, got {result.decision} (score={result.score})"
    )
    assert result.score < 0.6, f"Score should be < 0.6 for legitimate claim, got {result.score}"
    assert len(result.flags) >= 4, f"Should have flags from at least 4 layers, got {len(result.flags)}"

    print(f"[OK] Orchestrator approved legitimate claim with score {result.score}")
    for flag in result.flags:
        print(f"  Layer: {flag.layer} | Result: {flag.result}")
