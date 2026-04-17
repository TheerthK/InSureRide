# InSureRide

**AI-powered parametric income insurance for India's food-delivery riders.**
When external disruptions stop a rider from working, we detect it automatically
and pay them within hours. Zero forms. Zero claim filing. Zero waiting.

Guidewire DEVTrails 2026 — Phase 3 (Soar): *"Perfect for Your Worker."*

---

## What's in this repo

A FastAPI service implementing the core InSureRide platform: the pricing
brain, the rider trust score, the cohort engine, the profit guardrail,
and the referral flywheel. The full product vision, API contracts, and
workflows are captured in [`MASTER_DOC.md`](./MASTER_DOC.md).

```
InSureRide/
├── MASTER_DOC.md          Full product spec (persona, triggers, formulas)
├── main.py                FastAPI app — mounts all routers
├── db.py                  SQLAlchemy models (SQLite for demo, Postgres-ready)
├── seed_demo.py           Seed Ravi Kumar + a Chennai cohort
├── requirements.txt
├── schemas/               Shared Pydantic request/response models
├── premium_engine/        DL + rule hybrid pricing
│   ├── gen_synthetic.py   5,000-row synthetic training set
│   ├── train.py           Keras Sequential (12 → 32 → 16 → 1 sigmoid)
│   ├── predictor.py       Thread-safe model wrapper + analytic fallback
│   ├── rule_layer.py      Tier / tenure / cohort / referral adjustments
│   └── routes.py          POST /premium/quote, /policy/activate
├── profit_guardrail/      Margin-floor function (premium ≥ expected_loss / 0.82)
├── cohort_pricing/        KMeans(k=20) clustering + cohort repo + /cohort/recompute
├── rider_score/           0–1000 trust score + Bronze/Silver/Gold/Platinum tiers
├── referral/              6-char codes, redemption, leaderboard
├── tests/                 pytest — guardrail + rider score
├── data/                  Synthetic CSVs (gitignored)
└── models/                Trained Keras artifacts (gitignored)
```

## Quickstart

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# (optional) train the DL pricing model.
# The predictor falls back to an analytic approximation if absent.
python -m premium_engine.gen_synthetic
python -m premium_engine.train

# seed the demo rider (Ravi Kumar, Tambaram, Chennai)
python seed_demo.py

# boot the API
uvicorn main:app --reload --port 8000
```

Swagger UI → http://localhost:8000/docs

## Hybrid pricing formula (§7 of the spec)

```
Final Premium = max(MIN_FLOOR,
                    ProfitGuardrail(
                        RuleAdjust(
                            DLModel(features)
                        )))
```

- **MIN_FLOOR = ₹25**, **MAX_CAP = ₹150**
- **DL model** — 12-feature Keras network trained on 5,000 synthetic rows.
- **Rule layer** — Gold × 0.90, Platinum × 0.85, rookie (< 4 wks) × 1.10,
  mature cohort (≥ 200 active policies) × 0.95, referral credit − ₹50.
- **Profit guardrail** — `min_premium = expected_weekly_loss / (1 − 0.18)`.
  Per-rider weekly loss is derived from the cohort's recent payouts. The
  proposed premium is lifted to the floor if it falls below it, so
  pricing cannot push a cohort into a loss.

## Endpoint reference

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/premium/quote` | Price a rider for the upcoming week |
| `POST` | `/policy/activate` | Open a weekly policy (Mon–Sun) |
| `GET`  | `/policy/active/{rider_id}` | Current active policy + covered triggers |
| `GET`  | `/rider/{id}/score` | Trust score + tier + breakdown |
| `POST` | `/rider/{id}/recompute-score` | Persist a fresh score row |
| `POST` | `/cohort/recompute` | Re-cluster all ACTIVE riders into `k` cohorts |
| `GET`  | `/cohort/{cohort_id}` | Cohort centroid + loss ratio |
| `POST` | `/referral/generate` | Allocate a 6-char referral code |
| `POST` | `/referral/redeem` | Apply ₹50 credit on successful redemption |
| `GET`  | `/referral/leaderboard` | Top 10 referrers |
| `GET`  | `/health` | Liveness probe |

### Sample — `POST /premium/quote`

```bash
curl -s -X POST http://localhost:8000/premium/quote \
  -H 'Content-Type: application/json' \
  -d '{"rider_id": 1}' | jq
```

```json
{
  "rider_id": 1,
  "premium": 78.0,
  "cohort_id": "G-+12.92-+80.10-EVE-BIK",
  "risk_band": "medium",
  "trust_score": 899,
  "tier": "Gold",
  "breakdown": {
    "dl_score": 0.49,
    "dl_base": 86.12,
    "after_rules": 77.51,
    "after_profit": 77.51
  },
  "covered_triggers": [
    "heavy_rain", "extreme_heat", "severe_aqi", "heavy_traffic",
    "platform_outage", "restaurant_closure", "wrong_address_loop",
    "unsafe_neighbourhood", "animal_attack", "curfew",
    "vehicle_zone_issue", "slot_lockout"
  ]
}
```

### Sample — `POST /referral/redeem`

```bash
curl -s -X POST http://localhost:8000/referral/redeem \
  -H 'Content-Type: application/json' \
  -d '{"code": "RAVI42", "new_rider_id": 2}' | jq
```

```json
{ "credit_applied": 50.0, "referrer_rider_id": 1, "status": "ACTIVATED" }
```

## Tests

```bash
pytest -q
```

Covers the profit-guardrail identity (realised margin matches the
required margin at the floor), the trust-score weights and tier
boundaries, and the persona example for Ravi Kumar.

## Why it wins

- **Hybrid DL + rule-based pricing** — ML adaptiveness with business-rule
  guarantees. Static formulas can't do this.
- **Profit guardrail** — pricing literally cannot push a cohort into loss.
- **Cohort-aware feature loop** — more riders in a zone means richer loss
  data means better premiums for everyone. Growth and pricing reinforce
  each other; referrals plug directly into this flywheel.
- **12 parametric triggers** — weather, traffic, AQI, platform outages,
  slot lockouts, restaurant closures, animal attacks, and more. See
  `MASTER_DOC.md` §6.
