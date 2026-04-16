"""
InSureRide — Fraud Layer 5: Cluster Detection (Background Job)
Scans claims submitted in the last 90 seconds.
Groups by PIN code, device fingerprint family, UPI provider, and IP block.
Freezes clusters of ≥ 15 simultaneous claims → admin alert.

Runs as a background job every 60 seconds.
"""
import threading
import time
from datetime import datetime, timedelta
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Optional

from sqlalchemy.orm import Session

from db import SessionLocal
from models import Claim
from config import CLUSTER_SCAN_INTERVAL_SECONDS, CLUSTER_WINDOW_SECONDS, CLUSTER_MIN_SIZE


@dataclass
class ClusterAlertData:
    cluster_id: str
    size: int
    grouping_key: str          # e.g., "pin_code:600045"
    pin_code: Optional[str]
    claim_ids: list[int]
    detected_at: str
    status: str = "FROZEN"     # FROZEN, REVIEWED, CLEARED


# ── In-memory alert store ────────────────────────────────────────────────────
_cluster_alerts: list[ClusterAlertData] = []
_alert_counter: int = 0
_lock = threading.Lock()


def get_cluster_alerts() -> list[ClusterAlertData]:
    """Return all cluster alerts (most recent first)."""
    with _lock:
        return list(reversed(_cluster_alerts))


def _scan_for_clusters(db: Session):
    """
    Core scanning logic.
    Groups recent claims by 4 dimensions and flags any group ≥ CLUSTER_MIN_SIZE.
    """
    global _alert_counter

    cutoff = datetime.utcnow() - timedelta(seconds=CLUSTER_WINDOW_SECONDS)

    recent_claims = (
        db.query(Claim)
        .filter(Claim.created_at >= cutoff)
        .all()
    )

    if len(recent_claims) < CLUSTER_MIN_SIZE:
        return

    # Group by multiple dimensions
    groupings: dict[str, dict[str, list[Claim]]] = {
        "pin_code": defaultdict(list),
        "device_family": defaultdict(list),
        "upi_provider": defaultdict(list),
        "ip_block": defaultdict(list),
    }

    for claim in recent_claims:
        if claim.pin_code:
            groupings["pin_code"][claim.pin_code].append(claim)

        if claim.device_fingerprint:
            # Group by first 16 chars of fingerprint (family)
            family = claim.device_fingerprint[:16]
            groupings["device_family"][family].append(claim)

        if claim.upi_provider:
            groupings["upi_provider"][claim.upi_provider].append(claim)

        if claim.ip_address:
            # Group by /24 block (first 3 octets)
            ip_block = ".".join(claim.ip_address.split(".")[:3])
            groupings["ip_block"][ip_block].append(claim)

    # Check each grouping for suspicious clusters
    with _lock:
        for dimension, groups in groupings.items():
            for key, claims_in_group in groups.items():
                if len(claims_in_group) >= CLUSTER_MIN_SIZE:
                    _alert_counter += 1
                    alert = ClusterAlertData(
                        cluster_id=f"CLU-{_alert_counter:05d}",
                        size=len(claims_in_group),
                        grouping_key=f"{dimension}:{key}",
                        pin_code=key if dimension == "pin_code" else None,
                        claim_ids=[c.id for c in claims_in_group],
                        detected_at=datetime.utcnow().isoformat(),
                    )
                    _cluster_alerts.append(alert)

                    # Freeze all claims in the cluster
                    for claim in claims_in_group:
                        claim.status = "FROZEN_CLUSTER"
                        claim.fraud_flags = (
                            (claim.fraud_flags or "")
                            + f" | CLUSTER:{alert.cluster_id}"
                        )

                    print(
                        f"[Fraud Layer 5] ALERT - CLUSTER DETECTED: {alert.cluster_id} "
                        f"- {alert.size} claims grouped by {alert.grouping_key}"
                    )

        db.commit()


def _background_scanner():
    """Background thread that runs cluster detection periodically."""
    print(f"[Fraud Layer 5] Background cluster scanner started (every {CLUSTER_SCAN_INTERVAL_SECONDS}s)")
    while True:
        try:
            db = SessionLocal()
            try:
                _scan_for_clusters(db)
            finally:
                db.close()
        except Exception as e:
            print(f"[Fraud Layer 5] Scanner error: {e}")

        time.sleep(CLUSTER_SCAN_INTERVAL_SECONDS)


_scanner_thread: threading.Thread | None = None


def start_cluster_scanner():
    """Start the background cluster detection job."""
    global _scanner_thread
    if _scanner_thread is not None and _scanner_thread.is_alive():
        return

    _scanner_thread = threading.Thread(target=_background_scanner, daemon=True)
    _scanner_thread.start()


def run_cluster_check_now(db: Session):
    """
    Run a single cluster check synchronously.
    Useful for testing and the fraud score endpoint.
    """
    _scan_for_clusters(db)
