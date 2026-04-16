"""
InSureRide — Onboarding API Routes
POST /onboarding/link-platform
GET  /onboarding/rider-stats/{platform}/{rider_id}
POST /onboarding/set-zone
POST /onboarding/link-upi
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from db import get_db
from auth.jwt_service import get_current_rider_id
from onboarding.platform_link import link_platform, get_rider_stats
from onboarding.upi_link import link_upi
from onboarding.zone_set import set_zone
from onboarding.device_fingerprint import store_fingerprint
from security.validation import (
    PlatformLinkIn, PlatformLinkOut,
    RiderStatsOut,
    ZoneSetIn, ZoneSetOut,
    UpiLinkIn, UpiLinkOut,
)
from security.audit_log import write_audit

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


@router.post("/link-platform", response_model=PlatformLinkOut)
async def api_link_platform(
    body: PlatformLinkIn,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Link a delivery platform (Swiggy/Zomato/etc.) to the rider.
    Imports mock rider stats and stores them in the database.

    Requires rider_id as query param (in production, extracted from JWT).
    """
    rider_id = int(request.query_params.get("rider_id", 0))
    if rider_id <= 0:
        raise HTTPException(status_code=400, detail="rider_id query param required")

    try:
        link_platform(db, rider_id, body.platform, body.rider_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Also capture device fingerprint at onboarding
    user_agent = request.headers.get("user-agent", "unknown")
    device_id = request.headers.get("x-device-id", "unknown")
    client_ip = request.client.host if request.client else "0.0.0.0"
    try:
        store_fingerprint(db, rider_id, user_agent, device_id, client_ip)
    except ValueError:
        pass  # Non-fatal — may already be set

    write_audit(db, "RIDER", str(rider_id), "platform_linked", {
        "platform": body.platform, "platform_rider_id": body.rider_id,
    })

    return PlatformLinkOut(platform=body.platform, rider_id=body.rider_id)


@router.get("/rider-stats/{platform}/{rider_id}", response_model=RiderStatsOut)
async def api_get_rider_stats(platform: str, rider_id: str):
    """
    Fetch rider stats from the delivery platform (mocked).
    No auth required — used during onboarding before full login.
    """
    stats = get_rider_stats(platform, rider_id)
    return RiderStatsOut(**stats)


@router.post("/set-zone", response_model=ZoneSetOut)
async def api_set_zone(
    body: ZoneSetIn,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Auto-detect zone from GPS coordinates and store it.
    """
    rider_id = int(request.query_params.get("rider_id", 0))
    if rider_id <= 0:
        raise HTTPException(status_code=400, detail="rider_id query param required")

    try:
        zone_name = set_zone(db, rider_id, body.lat, body.lng)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    write_audit(db, "RIDER", str(rider_id), "zone_set", {
        "lat": body.lat, "lng": body.lng, "zone_name": zone_name,
    })

    return ZoneSetOut(zone_name=zone_name, lat=body.lat, lng=body.lng)


@router.post("/link-upi", response_model=UpiLinkOut)
async def api_link_upi(
    body: UpiLinkIn,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Validate and link a UPI VPA to the rider.
    Checks format and uniqueness (fraud hard-block).
    """
    rider_id = int(request.query_params.get("rider_id", 0))
    if rider_id <= 0:
        raise HTTPException(status_code=400, detail="rider_id query param required")

    try:
        result = link_upi(db, rider_id, body.vpa)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    write_audit(db, "RIDER", str(rider_id), "upi_linked", {"vpa": body.vpa})

    return UpiLinkOut(**result)
