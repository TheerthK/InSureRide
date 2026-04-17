"""SQLAlchemy setup + ORM models for InSureRide.

Uses SQLite for the demo; schema mirrors §13 of MASTER_DOC.md.
"""
from __future__ import annotations

import os
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, sessionmaker, relationship

DB_URL = os.getenv("INSURERIDE_DB_URL", "sqlite:///./insureride.db")

engine = create_engine(
    DB_URL, connect_args={"check_same_thread": False} if DB_URL.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


class Rider(Base):
    __tablename__ = "riders"
    id = Column(Integer, primary_key=True)
    phone = Column(String(15), unique=True)
    aadhaar_hash = Column(String(64), unique=True)
    device_fingerprint = Column(String(64), unique=True)
    upi_vpa = Column(String(100), unique=True)
    platform = Column(String(20))
    platform_rider_id = Column(String(50))
    language = Column(String(2), default="en")
    zone_lat = Column(Float)
    zone_lng = Column(Float)
    zone_name = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    referral_code = Column(String(6), unique=True)
    referred_by = Column(String(6))

    stats = relationship("RiderStats", uselist=False, back_populates="rider")


class RiderStats(Base):
    __tablename__ = "rider_stats"
    rider_id = Column(Integer, ForeignKey("riders.id"), primary_key=True)
    star_rating = Column(Float)
    weeks_on_platform = Column(Integer)
    avg_weekly_hours = Column(Float)
    total_incentives_4wk = Column(Float)
    bonus_history_4wk = Column(Float)
    shift_consistency = Column(Float)
    earnings_consistency = Column(Float)
    updated_at = Column(DateTime, default=datetime.utcnow)

    rider = relationship("Rider", back_populates="stats")


class TrustScore(Base):
    __tablename__ = "trust_scores"
    id = Column(Integer, primary_key=True)
    rider_id = Column(Integer, ForeignKey("riders.id"))
    score = Column(Integer)
    tier = Column(String(10))
    computed_at = Column(DateTime, default=datetime.utcnow)


class Policy(Base):
    __tablename__ = "policies"
    id = Column(Integer, primary_key=True)
    rider_id = Column(Integer, ForeignKey("riders.id"))
    week_start = Column(Date)
    week_end = Column(Date)
    premium_paid = Column(Float)
    cohort_id = Column(String(50))
    status = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)


class Cohort(Base):
    __tablename__ = "cohorts"
    id = Column(String(50), primary_key=True)
    centroid_lat = Column(Float)
    centroid_lng = Column(Float)
    shift_window = Column(String(20))
    vehicle_type = Column(String(20))
    active_policies = Column(Integer, default=0)
    loss_ratio = Column(Float, default=0.0)
    recent_payouts = Column(Float, default=0.0)
    recomputed_at = Column(DateTime, default=datetime.utcnow)


class Claim(Base):
    __tablename__ = "claims"
    id = Column(Integer, primary_key=True)
    rider_id = Column(Integer, ForeignKey("riders.id"))
    policy_id = Column(Integer, ForeignKey("policies.id"))
    trigger_event_id = Column(Integer)
    amount = Column(Float)
    status = Column(String(30))
    fraud_score = Column(Float)
    fraud_flags = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime)
    payout_ref = Column(String(50))


class Referral(Base):
    __tablename__ = "referrals"
    id = Column(Integer, primary_key=True)
    referrer_code = Column(String(6))
    referee_id = Column(Integer, ForeignKey("riders.id"))
    status = Column(String(20))
    credit_applied = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True)
    actor_type = Column(String(20))
    actor_id = Column(String(50))
    action = Column(String(50))
    payload_hash = Column(String(64))
    payload_summary = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)


def init_db() -> None:
    Base.metadata.create_all(engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
