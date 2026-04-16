"""
InSureRide — Zone Detection Service
Accepts lat/lng, maps to nearest known zone using Haversine distance.
Uses a hardcoded city→zone mapping (no real geocoder needed for demo).
"""
import math
from sqlalchemy.orm import Session

from models import Rider


# ── Hardcoded Zone Database ──────────────────────────────────────────────────
# Each entry: (zone_name, lat, lng)
KNOWN_ZONES = [
    # Chennai
    ("Tambaram, Chennai", 12.9249, 80.1000),
    ("T. Nagar, Chennai", 13.0418, 80.2341),
    ("Anna Nagar, Chennai", 13.0850, 80.2101),
    ("Velachery, Chennai", 12.9815, 80.2180),
    ("Adyar, Chennai", 13.0012, 80.2565),
    # Mumbai
    ("Andheri, Mumbai", 19.1136, 72.8697),
    ("Borivali, Mumbai", 19.2307, 72.8567),
    ("Bandra, Mumbai", 19.0596, 72.8295),
    ("Powai, Mumbai", 19.1176, 72.9060),
    ("Dadar, Mumbai", 19.0178, 72.8478),
    # Bangalore
    ("Koramangala, Bangalore", 12.9352, 77.6245),
    ("Whitefield, Bangalore", 12.9698, 77.7499),
    ("Indiranagar, Bangalore", 12.9784, 77.6408),
    ("HSR Layout, Bangalore", 12.9116, 77.6474),
    ("Jayanagar, Bangalore", 12.9308, 77.5838),
    # Delhi NCR
    ("Connaught Place, Delhi", 28.6315, 77.2167),
    ("Dwarka, Delhi", 28.5921, 77.0460),
    ("Noida Sector 18, NCR", 28.5706, 77.3218),
    ("Gurgaon Cyber City, NCR", 28.4949, 77.0880),
    ("Lajpat Nagar, Delhi", 28.5700, 77.2400),
    # Hyderabad
    ("Madhapur, Hyderabad", 17.4483, 78.3915),
    ("Begumpet, Hyderabad", 17.4432, 78.4672),
    ("Gachibowli, Hyderabad", 17.4401, 78.3489),
    ("Secunderabad, Hyderabad", 17.4399, 78.4983),
    # Kolkata
    ("Salt Lake, Kolkata", 22.5726, 88.4111),
    ("Park Street, Kolkata", 22.5518, 88.3516),
    ("Howrah, Kolkata", 22.5958, 88.2636),
    # Pune
    ("Kothrud, Pune", 18.5074, 73.8077),
    ("Hinjewadi, Pune", 18.5912, 73.7389),
    ("Viman Nagar, Pune", 18.5679, 73.9143),
]


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Haversine distance between two lat/lng points in kilometres."""
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def detect_zone(lat: float, lng: float) -> str:
    """
    Find the nearest known zone for the given coordinates.
    Returns zone_name string.
    """
    best_zone = "Unknown Zone"
    best_dist = float("inf")

    for zone_name, zone_lat, zone_lng in KNOWN_ZONES:
        dist = _haversine_km(lat, lng, zone_lat, zone_lng)
        if dist < best_dist:
            best_dist = dist
            best_zone = zone_name

    return best_zone


def set_zone(db: Session, rider_id: int, lat: float, lng: float) -> str:
    """
    Detect zone from coordinates and update rider record.
    Returns the zone name.
    """
    rider = db.query(Rider).filter(Rider.id == rider_id).first()
    if rider is None:
        raise ValueError("Rider not found")

    zone_name = detect_zone(lat, lng)
    rider.zone_lat = lat
    rider.zone_lng = lng
    rider.zone_name = zone_name
    db.commit()

    return zone_name
