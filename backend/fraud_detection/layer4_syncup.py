"""
InSureRide — Fraud Layer 4: Mandatory Sync-Up Gate
Decision matrix based on combined fraud score from Layers 2 + 3.

| Combined Score | Action                                          |
|---------------|--------------------------------------------------|
| < 0.6         | APPROVE — Pay first, ask questions later         |
| 0.6 – 0.9    | SYNCUP  — 24-hour hold, request selfie + GPS     |
| > 0.9         | REJECT  — Manual review, 72-hour SLA             |
"""
from dataclasses import dataclass
from enum import Enum

from config import FRAUD_AUTO_APPROVE_THRESHOLD, FRAUD_SYNCUP_THRESHOLD


class SyncUpDecision(str, Enum):
    APPROVE = "APPROVE"
    SYNCUP = "SYNCUP"
    REJECT = "REJECT"


@dataclass
class SyncUpResult:
    decision: SyncUpDecision
    combined_score: float
    message: str


def evaluate_syncup(flock_score: float, isolation_score: float) -> SyncUpResult:
    """
    Determine the action for a claim based on combined fraud scores.

    Args:
        flock_score: 0.0 (legit) to 1.0 (suspicious) from Layer 2.
        isolation_score: 0.0 (normal) to 1.0 (anomalous) from Layer 3.

    Returns:
        SyncUpResult with decision, combined score, and explanation.
    """
    # Weighted average: flock is slightly more reliable (0.55 : 0.45)
    combined = 0.55 * flock_score + 0.45 * isolation_score
    combined = round(combined, 4)

    if combined < FRAUD_AUTO_APPROVE_THRESHOLD:
        return SyncUpResult(
            decision=SyncUpDecision.APPROVE,
            combined_score=combined,
            message=(
                f"Auto-approved (score {combined:.2f} < {FRAUD_AUTO_APPROVE_THRESHOLD}). "
                f"Pay first, ask questions later. Payout within 2 hours."
            ),
        )
    elif combined <= FRAUD_SYNCUP_THRESHOLD:
        return SyncUpResult(
            decision=SyncUpDecision.SYNCUP,
            combined_score=combined,
            message=(
                f"Sync-up required (score {combined:.2f} in [{FRAUD_AUTO_APPROVE_THRESHOLD}–{FRAUD_SYNCUP_THRESHOLD}]). "
                f"24-hour hold. Push notification sent for selfie + GPS verification."
            ),
        )
    else:
        return SyncUpResult(
            decision=SyncUpDecision.REJECT,
            combined_score=combined,
            message=(
                f"Rejected + manual review (score {combined:.2f} > {FRAUD_SYNCUP_THRESHOLD}). "
                f"72-hour resolution SLA. SMS sent with appeal keyword."
            ),
        )


def reevaluate_after_syncup(
    original_combined_score: float,
    selfie_verified: bool,
    gps_matches: bool,
) -> SyncUpResult:
    """
    Re-evaluate a claim after the rider completes the sync-up challenge.

    Args:
        original_combined_score: the score that triggered the sync-up.
        selfie_verified: True if selfie liveness passed.
        gps_matches: True if GPS is within expected zone.
    """
    # Reduce score if verification passes
    reduction = 0.0
    if selfie_verified:
        reduction += 0.25
    if gps_matches:
        reduction += 0.20

    new_score = max(0.0, original_combined_score - reduction)

    if new_score < FRAUD_AUTO_APPROVE_THRESHOLD:
        return SyncUpResult(
            decision=SyncUpDecision.APPROVE,
            combined_score=new_score,
            message=f"Sync-up passed. Score reduced {original_combined_score:.2f} → {new_score:.2f}. Payout released.",
        )
    else:
        return SyncUpResult(
            decision=SyncUpDecision.REJECT,
            combined_score=new_score,
            message=f"Sync-up insufficient. Score {new_score:.2f} still above threshold. Escalating to manual review.",
        )
