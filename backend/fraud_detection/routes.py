"""
InSureRide — Fraud Detection API Routes
POST /fraud/score        — Score a claim through the 5-layer pipeline
GET  /fraud/clusters     — Admin: get cluster alerts feed
POST /claims/{id}/syncup — Rider: submit selfie + GPS for sync-up verification
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db import get_db
from models import Claim
from fraud_detection.score_orchestrator import score_claim
from fraud_detection.layer4_syncup import reevaluate_after_syncup
from fraud_detection.layer5_cluster import get_cluster_alerts
from security.validation import (
    FraudScoreIn, FraudScoreOut, FraudFlag as FraudFlagSchema,
    ClusterAlert,
    SyncUpIn, SyncUpOut,
)
from security.audit_log import write_audit

router = APIRouter(tags=["Fraud Detection"])


@router.post("/fraud/score", response_model=FraudScoreOut)
async def api_fraud_score(body: FraudScoreIn, db: Session = Depends(get_db)):
    """
    Score a claim through the full 5-layer fraud detection pipeline.

    Layers:
    1. Hard blocks (Aadhaar/device/UPI uniqueness)
    2. Flock Verification (1 km spatial check)
    3. Isolation Forest (behavioral anomaly ML)
    4. Sync-up gate (decision matrix)
    5. Cluster detection (coordinated ring scan)

    Returns combined score, decision (APPROVE/SYNCUP/REJECT/BLOCKED), and per-layer flags.
    """
    result = score_claim(db, body.claim_id)

    write_audit(db, "SYSTEM", str(body.claim_id), "fraud_scored", {
        "claim_id": body.claim_id,
        "score": result.score,
        "decision": result.decision,
    })

    return FraudScoreOut(
        claim_id=result.claim_id,
        score=result.score,
        decision=result.decision,
        flags=[
            FraudFlagSchema(layer=f.layer, result=f.result, details=f.details)
            for f in result.flags
        ],
    )


@router.get("/fraud/clusters", response_model=list[ClusterAlert])
async def api_fraud_clusters():
    """
    Admin endpoint: Get the fraud cluster alerts feed.
    Shows clusters detected by Layer 5 (coordinated submissions from
    same PIN code, device family, UPI provider, or IP block).
    """
    alerts = get_cluster_alerts()
    return [
        ClusterAlert(
            cluster_id=a.cluster_id,
            size=a.size,
            grouping_key=a.grouping_key,
            pin_code=a.pin_code,
            detected_at=a.detected_at,
            status=a.status,
        )
        for a in alerts
    ]


@router.post("/claims/{claim_id}/syncup", response_model=SyncUpOut)
async def api_syncup_verification(
    claim_id: int,
    body: SyncUpIn,
    db: Session = Depends(get_db),
):
    """
    Rider submits selfie + GPS for sync-up verification.
    Re-evaluates the fraud score.  If passed, payout is released.
    If still flagged, escalates to manual review.
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if claim is None:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim.status != "NEEDS_SYNCUP":
        raise HTTPException(
            status_code=400,
            detail=f"Claim is not in NEEDS_SYNCUP status (current: {claim.status})"
        )

    # In demo, selfie is always "verified" (we just check it's non-empty)
    selfie_verified = len(body.selfie_b64) > 50

    # GPS match: check if within 2 km of the original claim location
    from fraud_detection.layer2_flock import haversine_km
    claim_lat = claim.claim_lat or 12.9249
    claim_lng = claim.claim_lng or 80.1000
    gps_distance = haversine_km(body.gps_lat, body.gps_lng, claim_lat, claim_lng)
    gps_matches = gps_distance < 2.0

    result = reevaluate_after_syncup(
        original_combined_score=claim.fraud_score or 0.75,
        selfie_verified=selfie_verified,
        gps_matches=gps_matches,
    )

    # Update claim status
    claim.fraud_score = result.combined_score
    if result.decision.value == "APPROVE":
        claim.status = "APPROVED"
    else:
        claim.status = "MANUAL_REVIEW"
    db.commit()

    write_audit(db, "RIDER", str(claim.rider_id), "syncup_completed", {
        "claim_id": claim_id,
        "selfie_verified": selfie_verified,
        "gps_matches": gps_matches,
        "new_score": result.combined_score,
        "decision": result.decision.value,
    })

    return SyncUpOut(
        claim_id=claim_id,
        new_score=result.combined_score,
        decision=result.decision.value,
        message=result.message,
    )
