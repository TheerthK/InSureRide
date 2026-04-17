from db import SessionLocal
from models import Rider, Policy, Claim, TriggerEvent
from datetime import datetime
from claims_engine.claim_processor import process_claims

def create_claims(event):
    db = SessionLocal()

    # Create trigger event
    trigger = TriggerEvent(
        trigger_type=event["type"],
        zone_lat=12.9716,
        zone_lng=80.2206,
        threshold_value=event["value"],
        fired_at=datetime.utcnow()
    )
    db.add(trigger)
    db.commit()
    db.refresh(trigger)

    print(f"📡 Trigger stored: {event['type']}")

    # Get riders
    riders = db.query(Rider).all()

    for rider in riders:
        policy = db.query(Policy).filter(
            Policy.rider_id == rider.id,
            Policy.status == "ACTIVE"
        ).first()

        if not policy:
            continue

        claim = Claim(
            rider_id=rider.id,
            policy_id=policy.id,
            trigger_event_id=trigger.id,
            amount=600,
            status="PENDING_FRAUD_CHECK"
        )

        db.add(claim)

    db.commit()
    db.close()

    print("📄 Claims created for all riders")

    from claims_engine.claim_processor import process_claims

    process_claims()