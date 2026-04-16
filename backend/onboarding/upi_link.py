"""
InSureRide — UPI Link Service
VPA validation and uniqueness check.
"""
import re
from sqlalchemy.orm import Session

from models import Rider


VPA_PATTERN = re.compile(r"^[\w.\-]+@[\w]+$")


def validate_vpa_format(vpa: str) -> bool:
    """Check if VPA matches expected format: name@bank"""
    return bool(VPA_PATTERN.match(vpa))


def is_vpa_unique(db: Session, vpa: str, exclude_rider_id: int | None = None) -> bool:
    """Check that no other rider has this UPI VPA (fraud hard-block)."""
    query = db.query(Rider).filter(Rider.upi_vpa == vpa)
    if exclude_rider_id:
        query = query.filter(Rider.id != exclude_rider_id)
    return query.first() is None


def link_upi(db: Session, rider_id: int, vpa: str) -> dict:
    """
    Validate and store UPI VPA for a rider.

    Raises ValueError if format is invalid or VPA is already taken.
    """
    if not validate_vpa_format(vpa):
        raise ValueError(f"Invalid UPI VPA format: {vpa}")

    if not is_vpa_unique(db, vpa, exclude_rider_id=rider_id):
        raise ValueError(f"UPI VPA already linked to another rider: {vpa}")

    rider = db.query(Rider).filter(Rider.id == rider_id).first()
    if rider is None:
        raise ValueError("Rider not found")

    rider.upi_vpa = vpa
    db.commit()

    return {"verified": True, "vpa": vpa}
