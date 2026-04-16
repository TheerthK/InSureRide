"""
InSureRide — SQLAlchemy ORM Models
Matches the schema defined in MASTER_DOC §13.
"""
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime, Date,
    ForeignKey, UniqueConstraint,
)
from sqlalchemy.orm import relationship

from db import Base


class Rider(Base):
    __tablename__ = "riders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    phone = Column(String(15), unique=True, nullable=False)
    aadhaar_hash = Column(String(64), unique=True, nullable=True)
    device_fingerprint = Column(String(64), unique=True, nullable=True)
    upi_vpa = Column(String(100), unique=True, nullable=True)
    platform = Column(String(20), nullable=True)
    platform_rider_id = Column(String(50), nullable=True)
    language = Column(String(2), default="en")
    zone_lat = Column(Float, nullable=True)
    zone_lng = Column(Float, nullable=True)
    zone_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    referral_code = Column(String(6), unique=True, nullable=True)
    referred_by = Column(String(6), nullable=True)

    # Relationships
    stats = relationship("RiderStats", back_populates="rider", uselist=False)
    trust_scores = relationship("TrustScore", back_populates="rider")
    policies = relationship("Policy", back_populates="rider")
    claims = relationship("Claim", back_populates="rider")


class RiderStats(Base):
    __tablename__ = "rider_stats"

    rider_id = Column(Integer, ForeignKey("riders.id"), primary_key=True)
    star_rating = Column(Float, nullable=True)
    weeks_on_platform = Column(Integer, nullable=True)
    avg_weekly_hours = Column(Float, nullable=True)
    total_incentives_4wk = Column(Float, nullable=True)
    bonus_history_4wk = Column(Float, nullable=True)
    shift_consistency = Column(Float, nullable=True)
    earnings_consistency = Column(Float, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    rider = relationship("Rider", back_populates="stats")


class TrustScore(Base):
    __tablename__ = "trust_scores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rider_id = Column(Integer, ForeignKey("riders.id"), nullable=False)
    score = Column(Integer, nullable=False)
    tier = Column(String(10), nullable=False)
    computed_at = Column(DateTime, default=datetime.utcnow)

    rider = relationship("Rider", back_populates="trust_scores")


class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rider_id = Column(Integer, ForeignKey("riders.id"), nullable=False)
    week_start = Column(Date, nullable=False)
    week_end = Column(Date, nullable=False)
    premium_paid = Column(Float, nullable=False)
    cohort_id = Column(String(50), nullable=True)
    status = Column(String(20), default="ACTIVE")  # ACTIVE, EXPIRED, CANCELLED
    created_at = Column(DateTime, default=datetime.utcnow)

    rider = relationship("Rider", back_populates="policies")
    claims = relationship("Claim", back_populates="policy")


class Cohort(Base):
    __tablename__ = "cohorts"

    id = Column(String(50), primary_key=True)
    centroid_lat = Column(Float, nullable=True)
    centroid_lng = Column(Float, nullable=True)
    shift_window = Column(String(20), nullable=True)
    vehicle_type = Column(String(20), nullable=True)
    active_policies = Column(Integer, default=0)
    loss_ratio = Column(Float, default=0.0)
    recomputed_at = Column(DateTime, default=datetime.utcnow)


class TriggerEvent(Base):
    __tablename__ = "trigger_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    trigger_type = Column(String(30), nullable=False)
    zone_lat = Column(Float, nullable=True)
    zone_lng = Column(Float, nullable=True)
    radius_km = Column(Float, nullable=True)
    threshold_value = Column(Float, nullable=True)
    fired_at = Column(DateTime, default=datetime.utcnow)
    data_source = Column(String(50), nullable=True)
    raw_evidence = Column(Text, nullable=True)


class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rider_id = Column(Integer, ForeignKey("riders.id"), nullable=False)
    policy_id = Column(Integer, ForeignKey("policies.id"), nullable=False)
    trigger_event_id = Column(Integer, ForeignKey("trigger_events.id"), nullable=True)
    amount = Column(Float, nullable=True)
    status = Column(String(30), default="PENDING_FRAUD_CHECK")
    fraud_score = Column(Float, nullable=True)
    fraud_flags = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)
    payout_ref = Column(String(50), nullable=True)
    # Extra fields for fraud detection
    claim_lat = Column(Float, nullable=True)
    claim_lng = Column(Float, nullable=True)
    pin_code = Column(String(10), nullable=True)
    device_fingerprint = Column(String(64), nullable=True)
    upi_provider = Column(String(20), nullable=True)
    ip_address = Column(String(45), nullable=True)

    rider = relationship("Rider", back_populates="claims")
    policy = relationship("Policy", back_populates="claims")
    trigger_event = relationship("TriggerEvent")


class Referral(Base):
    __tablename__ = "referrals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    referrer_code = Column(String(6), nullable=False)
    referee_id = Column(Integer, ForeignKey("riders.id"), nullable=False)
    status = Column(String(20), default="PENDING")  # PENDING, ACTIVATED
    credit_applied = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    actor_type = Column(String(20), nullable=False)   # SYSTEM, RIDER, ADMIN
    actor_id = Column(String(50), nullable=True)
    action = Column(String(50), nullable=False)
    payload_hash = Column(String(64), nullable=True)
    payload_summary = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
