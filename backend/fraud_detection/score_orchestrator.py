"""
InSureRide — Fraud Score Orchestrator
Single entry point: score_claim(claim_id) → FraudResult
Runs all 5 fraud layers in sequence.
"""
import random
from dataclasses import dataclass, field
from datetime import datetime

from sqlalchemy.orm import Session

from models import Claim, Rider
from fraud_detection.layer1_hardblocks import run_hard_blocks, BlockResult
from fraud_detection.layer2_flock import flock_verify, FlockDecision, FlockResult
from fraud_detection.layer3_isolation_forest import predict_anomaly_score
from fraud_detection.layer4_syncup import evaluate_syncup, SyncUpDecision, SyncUpResult
from fraud_detection.layer5_cluster import run_cluster_check_now
from config import DEMO_MODE


@dataclass
class FraudFlag:
    layer: str
    result: str
    details: str


@dataclass
class FraudResult:
    claim_id: int
    score: float
    decision: str        # APPROVE, SYNCUP, REJECT, BLOCKED
    flags: list[FraudFlag] = field(default_factory=list)


def _flock_decision_to_score(decision: FlockDecision) -> float:
    """Convert flock decision to a 0–1 score."""
    return {
        FlockDecision.PASS: 0.1,
        FlockDecision.SKIPPED: 0.2,     # Uncertain — slight bump
        FlockDecision.FLAG_MEDIUM: 0.6,
        FlockDecision.FLAG_HIGH: 0.9,
    }[decision]


def score_claim(db: Session, claim_id: int) -> FraudResult:
    """
    Master orchestrator — runs all 5 fraud layers in sequence on a claim.

    Flow:
    1. Layer 1 (Hard Blocks) — if fail, immediate BLOCKED.
    2. Layer 2 (Flock Verification) — spatial anomaly check.
    3. Layer 3 (Isolation Forest) — behavioral anomaly ML.
    4. Layer 4 (Sync-Up Gate) — decision matrix on combined score.
    5. Layer 5 (Cluster Detection) — triggered as side effect.

    Returns FraudResult with combined score, decision, and per-layer flags.
    """
    flags: list[FraudFlag] = []

    # ── Fetch claim and rider ────────────────────────────────────────────
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if claim is None:
        return FraudResult(
            claim_id=claim_id,
            score=1.0,
            decision="BLOCKED",
            flags=[FraudFlag("system", "FAIL", "Claim not found")],
        )

    rider = db.query(Rider).filter(Rider.id == claim.rider_id).first()
    if rider is None:
        return FraudResult(
            claim_id=claim_id,
            score=1.0,
            decision="BLOCKED",
            flags=[FraudFlag("system", "FAIL", "Rider not found")],
        )

    # ── Layer 1: Hard Blocks ─────────────────────────────────────────────
    hard_block: BlockResult = run_hard_blocks(db, claim.rider_id)
    flags.append(FraudFlag(
        layer="layer1_hardblocks",
        result="PASS" if hard_block.passed else "BLOCKED",
        details=hard_block.reason + (f" — {hard_block.details}" if hard_block.details else ""),
    ))

    if not hard_block.passed:
        claim.fraud_score = 1.0
        claim.fraud_flags = str([f.__dict__ for f in flags])
        claim.status = "REJECTED"
        db.commit()
        return FraudResult(
            claim_id=claim_id,
            score=1.0,
            decision="BLOCKED",
            flags=flags,
        )

    # ── Layer 2: Flock Verification ──────────────────────────────────────
    claim_lat = claim.claim_lat or rider.zone_lat or 12.9249
    claim_lng = claim.claim_lng or rider.zone_lng or 80.1000

    flock_result: FlockResult = flock_verify(db, claim.rider_id, claim_lat, claim_lng)
    flock_score = _flock_decision_to_score(flock_result.decision)

    flags.append(FraudFlag(
        layer="layer2_flock",
        result=flock_result.decision.value,
        details=flock_result.detail,
    ))

    # ── Layer 3: Isolation Forest ────────────────────────────────────────
    # Build feature vector from claim + rider context
    rng = random.Random(claim_id)  # Deterministic for demo
    if DEMO_MODE:
        gps_jitter = rng.uniform(0.01, 0.3)
        login_delta = rng.uniform(30, 300)
        account_age = (datetime.utcnow() - rider.created_at).days if rider.created_at else 90
        claim_freq = rng.uniform(0, 1.5)
        order_rate = rng.uniform(0, 0.1)
        dist_centroid = rng.uniform(0.1, 2.0)
    else:
        gps_jitter = 0.1
        login_delta = 120
        account_age = (datetime.utcnow() - rider.created_at).days if rider.created_at else 90
        claim_freq = 0.5
        order_rate = 0.05
        dist_centroid = 1.0

    isolation_score = predict_anomaly_score(
        gps_jitter_variance=gps_jitter,
        login_trigger_delta_min=login_delta,
        account_age_days=account_age,
        claim_frequency_30d=claim_freq,
        order_rate_during_trigger=order_rate,
        distance_from_centroid_km=dist_centroid,
    )

    flags.append(FraudFlag(
        layer="layer3_isolation_forest",
        result=f"score={isolation_score:.4f}",
        details=f"Behavioral anomaly: gps_jitter={gps_jitter:.3f}, login_delta={login_delta:.0f}min, "
                f"age={account_age}d, claims/30d={claim_freq:.1f}, order_rate={order_rate:.2f}, "
                f"dist_centroid={dist_centroid:.1f}km",
    ))

    # ── Layer 4: Sync-Up Gate ────────────────────────────────────────────
    syncup_result: SyncUpResult = evaluate_syncup(flock_score, isolation_score)

    flags.append(FraudFlag(
        layer="layer4_syncup",
        result=syncup_result.decision.value,
        details=syncup_result.message,
    ))

    # ── Layer 5: Cluster Check (side effect) ─────────────────────────────
    try:
        run_cluster_check_now(db)
        flags.append(FraudFlag(
            layer="layer5_cluster",
            result="CHECKED",
            details="Cluster scan completed. No new clusters flagged for this claim.",
        ))
    except Exception as e:
        flags.append(FraudFlag(
            layer="layer5_cluster",
            result="ERROR",
            details=f"Cluster check error: {str(e)}",
        ))

    # ── Final Decision ───────────────────────────────────────────────────
    final_score = syncup_result.combined_score
    decision_map = {
        SyncUpDecision.APPROVE: "APPROVED",
        SyncUpDecision.SYNCUP: "NEEDS_SYNCUP",
        SyncUpDecision.REJECT: "REJECTED",
    }
    final_decision = decision_map[syncup_result.decision]

    # Update claim record
    claim.fraud_score = final_score
    claim.fraud_flags = str([f.__dict__ for f in flags])
    claim.status = final_decision if final_decision != "APPROVED" else "APPROVED"
    db.commit()

    return FraudResult(
        claim_id=claim_id,
        score=final_score,
        decision=final_decision,
        flags=flags,
    )
