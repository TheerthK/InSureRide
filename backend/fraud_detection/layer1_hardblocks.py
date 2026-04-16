"""
InSureRide — Fraud Layer 1: Hard Blocks
Database-level uniqueness enforcement.
- One Aadhaar hash  = one active policy
- One device fingerprint hash = one active policy
- One UPI VPA = one active policy

If a claim comes from a duplicate, freeze + flag.
"""
from dataclasses import dataclass
from sqlalchemy.orm import Session

from models import Rider, Claim


@dataclass
class BlockResult:
    passed: bool
    reason: str = ""
    details: str = ""


def check_aadhaar_uniqueness(db: Session, rider_id: int) -> BlockResult:
    """Ensure rider's Aadhaar hash isn't shared with another active account."""
    rider = db.query(Rider).filter(Rider.id == rider_id).first()
    if rider is None:
        return BlockResult(passed=False, reason="rider_not_found")

    if rider.aadhaar_hash is None:
        # No Aadhaar linked yet — pass (will be caught at onboarding)
        return BlockResult(passed=True, reason="no_aadhaar_linked")

    duplicate = (
        db.query(Rider)
        .filter(Rider.aadhaar_hash == rider.aadhaar_hash)
        .filter(Rider.id != rider_id)
        .first()
    )
    if duplicate:
        return BlockResult(
            passed=False,
            reason="duplicate_aadhaar",
            details=f"Aadhaar hash matches rider #{duplicate.id}",
        )
    return BlockResult(passed=True)


def check_device_uniqueness(db: Session, rider_id: int) -> BlockResult:
    """Ensure rider's device fingerprint isn't shared with another account."""
    rider = db.query(Rider).filter(Rider.id == rider_id).first()
    if rider is None:
        return BlockResult(passed=False, reason="rider_not_found")

    if rider.device_fingerprint is None:
        return BlockResult(passed=True, reason="no_device_linked")

    duplicate = (
        db.query(Rider)
        .filter(Rider.device_fingerprint == rider.device_fingerprint)
        .filter(Rider.id != rider_id)
        .first()
    )
    if duplicate:
        return BlockResult(
            passed=False,
            reason="duplicate_device",
            details=f"Device fingerprint matches rider #{duplicate.id}",
        )
    return BlockResult(passed=True)


def check_upi_uniqueness(db: Session, rider_id: int) -> BlockResult:
    """Ensure rider's UPI VPA isn't shared with another account."""
    rider = db.query(Rider).filter(Rider.id == rider_id).first()
    if rider is None:
        return BlockResult(passed=False, reason="rider_not_found")

    if rider.upi_vpa is None:
        return BlockResult(passed=True, reason="no_upi_linked")

    duplicate = (
        db.query(Rider)
        .filter(Rider.upi_vpa == rider.upi_vpa)
        .filter(Rider.id != rider_id)
        .first()
    )
    if duplicate:
        return BlockResult(
            passed=False,
            reason="duplicate_upi",
            details=f"UPI VPA matches rider #{duplicate.id}",
        )
    return BlockResult(passed=True)


def run_hard_blocks(db: Session, rider_id: int) -> BlockResult:
    """
    Run all 3 hard-block checks.
    Returns first failure; if all pass, returns pass.
    """
    checks = [
        check_aadhaar_uniqueness,
        check_device_uniqueness,
        check_upi_uniqueness,
    ]

    for check_fn in checks:
        result = check_fn(db, rider_id)
        if not result.passed:
            return result

    return BlockResult(passed=True, reason="all_hard_blocks_passed")
