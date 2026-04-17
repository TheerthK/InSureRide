"""Premium engine: hybrid DL model + rule layer + profit guardrail.

Final Premium = max(MIN_FLOOR, ProfitGuardrail(RuleAdjust(DLModel(features))))
"""

FEATURE_COLUMNS = [
    "star_rating",
    "weeks_on_platform",
    "avg_weekly_hours",
    "claim_count_90d",
    "zone_risk_index",
    "weather_forecast_risk",
    "aqi_forecast_risk",
    "traffic_congestion_index",
    "cohort_loss_ratio",
    "incentive_achievement_rate",
    "shift_consistency",
    "vehicle_type_scalar",
]

MIN_FLOOR = 25.0
MAX_CAP = 150.0
