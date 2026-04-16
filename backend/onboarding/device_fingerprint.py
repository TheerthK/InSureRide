"""
InSureRide — Device Fingerprint Service
Captures a hash of (User-Agent + device_id + IP) at onboarding time.
Used by fraud Layer 1 (hard blocks) to enforce one-device-per-policy.
"""
import hashlib

from sqlalchemy.orm import Session

from models import Rider


def compute_fingerprint(user_agent: str, device_id: str, ip_address: str) -> str:
    """
    SHA-256 hash of the device signature.
    Three components ensure uniqueness even if one is spoofed.
    """
    raw = f"{user_agent}|{device_id}|{ip_address}"
    return hashlib.sha256(raw.encode()).hexdigest()


def is_fingerprint_unique(db: Session, fingerprint: str, exclude_rider_id: int | None = None) -> bool:
    """Check that no other rider has this device fingerprint."""
    query = db.query(Rider).filter(Rider.device_fingerprint == fingerprint)
    if exclude_rider_id:
        query = query.filter(Rider.id != exclude_rider_id)
    return query.first() is None


def store_fingerprint(
    db: Session,
    rider_id: int,
    user_agent: str,
    device_id: str,
    ip_address: str,
) -> str:
    """
    Compute and store device fingerprint for a rider.

    Returns the fingerprint hash.
    Raises ValueError if fingerprint is already linked to another rider.
    """
    fingerprint = compute_fingerprint(user_agent, device_id, ip_address)

    if not is_fingerprint_unique(db, fingerprint, exclude_rider_id=rider_id):
        raise ValueError("Device already linked to another account (possible fraud)")

    rider = db.query(Rider).filter(Rider.id == rider_id).first()
    if rider is None:
        raise ValueError("Rider not found")

    rider.device_fingerprint = fingerprint
    db.commit()

    return fingerprint
