"""
InSureRide — Full Endpoint Integration Test
Tests all 13+ API endpoints using FastAPI TestClient.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app
from models import Claim, Policy
from db import SessionLocal

client = TestClient(app)

passed = 0
failed = 0

def test(name, condition, detail=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  PASS  {name} {detail}")
    else:
        failed += 1
        print(f"  FAIL  {name} {detail}")

# ── 1. Health ─────────────────────────────────────────
r = client.get("/")
test("1. Health Check", r.status_code == 200, f"status={r.json().get('status')}")

# ── 2. OTP Request ────────────────────────────────────
r = client.post("/auth/request-otp", json={"phone": "+919876543210"})
test("2. OTP Request", r.status_code == 200, f"request_id={r.json().get('request_id', 'N/A')}")
req_id = r.json().get("request_id")

# ── 3. OTP Verify ─────────────────────────────────────
r = client.post("/auth/verify-otp", json={"request_id": req_id, "otp": "123456"})
test("3. OTP Verify + JWT", r.status_code == 200, f"rider_id={r.json().get('rider_id')}")
rid = r.json().get("rider_id")
refresh_tok = r.json().get("refresh_token")

# ── 4. Token Refresh ──────────────────────────────────
r = client.post("/auth/refresh", json={"refresh_token": refresh_tok})
test("4. Token Refresh", r.status_code == 200, "new access_token obtained")

# ── 5. Rider Stats ────────────────────────────────────
r = client.get("/onboarding/rider-stats/swiggy/SW00104729")
j = r.json()
test("5. Rider Stats", r.status_code == 200, f"star={j.get('star_rating')}, hours={j.get('avg_weekly_hours')}")

# ── 6. Platform Link ─────────────────────────────────
r = client.post(f"/onboarding/link-platform?rider_id={rid}", json={"platform": "swiggy", "rider_id": "SW00104729"})
test("6. Platform Link", r.status_code == 200, f"linked={r.json().get('linked')}")

# ── 7. Set Zone ───────────────────────────────────────
r = client.post(f"/onboarding/set-zone?rider_id={rid}", json={"lat": 12.9249, "lng": 80.1000})
test("7. Set Zone", r.status_code == 200, f"zone={r.json().get('zone_name')}")

# ── 8. Link UPI ───────────────────────────────────────
r = client.post(f"/onboarding/link-upi?rider_id={rid}", json={"vpa": "ravi.test@phonepe"})
test("8. Link UPI", r.status_code == 200, f"verified={r.json().get('verified')}")

# ── 9. Chat English ──────────────────────────────────
r = client.post("/chat", json={"rider_id": rid, "message": "What is my claim status?", "lang": "en"})
test("9. Chat (English)", r.status_code == 200, f"intent={r.json().get('intent')}")

# ── 10. Chat Tamil ────────────────────────────────────
r = client.post("/chat", json={"rider_id": rid, "message": "vanakkam", "lang": "ta"})
test("10. Chat (Tamil)", r.status_code == 200, f"intent={r.json().get('intent')}")

# ── 11. Chat Hindi ────────────────────────────────────
r = client.post("/chat", json={"rider_id": rid, "message": "mera claim kahan hai", "lang": "hi"})
test("11. Chat (Hindi)", r.status_code == 200, f"intent={r.json().get('intent')}")

# ── 12. Chat Referral ─────────────────────────────────
r = client.post("/chat", json={"rider_id": rid, "message": "how do I refer a friend?", "lang": "en"})
test("12. Chat (Referral)", r.status_code == 200, f"intent={r.json().get('intent')}")

# ── 13. Fraud Clusters ───────────────────────────────
r = client.get("/fraud/clusters")
test("13. Fraud Clusters", r.status_code == 200, f"alerts={len(r.json())}")

# ── 14. Fraud Score ───────────────────────────────────
db = SessionLocal()
policy = db.query(Policy).first()
if policy:
    claim = Claim(
        rider_id=policy.rider_id, policy_id=policy.id,
        amount=600, status="PENDING_FRAUD_CHECK",
        claim_lat=12.9249, claim_lng=80.1000, pin_code="600045",
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    r = client.post("/fraud/score", json={"claim_id": claim.id})
    j = r.json()
    test("14. Fraud Score", r.status_code == 200, f"score={j.get('score')}, decision={j.get('decision')}")
    db.close()
else:
    test("14. Fraud Score", False, "No policy found for testing")

# ── Summary ───────────────────────────────────────────
print()
print(f"{'='*50}")
print(f"  Results: {passed} passed, {failed} failed out of {passed+failed}")
print(f"{'='*50}")
