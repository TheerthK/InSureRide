from db import SessionLocal
from models import Claim
from payout.disburse import disburse

def process_claims():
    db = SessionLocal()

    claims = db.query(Claim).filter(
        Claim.status == "PENDING_FRAUD_CHECK"
    ).all()

    for claim in claims:
        try:
            from fraud_detection.score_orchestrator import score_claim

            result = score_claim(db,claim.id)
            score = result.score
            # Call fraud API
           

            print(f"🧠 Fraud score for claim {claim.id}: {score}")

            

            if score < 0.6:
                claim.status = "APPROVED"
                print(f"✅ Claim {claim.id} approved")
                disburse(claim)

            elif score < 0.9:
                claim.status = "NEEDS_SYNCUP"
                print(f"📞 Sync-up required for rider {claim.rider_id} (claim {claim.id})")

            else:
                claim.status = "REJECTED"
                print(f"❌ Claim {claim.id} rejected due to high fraud score")

        except Exception as e:
            print(f"❌ Error processing claim {claim.id}: {e}")

    db.commit()
    db.close()