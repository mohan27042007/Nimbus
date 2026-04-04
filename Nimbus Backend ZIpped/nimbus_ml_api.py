from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import xgboost as xgb
import numpy as np
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title='Nimbus ML API', version='1.0.0')

# Allow all origins for hackathon
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*']
)

# Load models on startup
premium_model = xgb.XGBRegressor()
premium_model._estimator_type = "regressor"  # <--- Add this patch
premium_model.load_model('nimbus_premium_model.json')

fraud_model = xgb.XGBRegressor()
fraud_model._estimator_type = "regressor"    # <--- Add this patch
fraud_model.load_model('nimbus_fraud_model.json')

print('Both models loaded successfully')

# =====================
# PREMIUM ENDPOINT
# =====================

class PremiumRequest(BaseModel):
    zone_risk_score: int           # 0-100
    earnings_baseline: float       # daily earnings in Rs
    trust_score: int               # 0-100
    past_claims_count: int         # last 6 months
    claim_approval_rate: float     # 0.0-1.0
    weeks_active: int              # weeks on platform
    forecast_rain_mm: float        # next 7 days
    forecast_aqi: int              # next 7 days
    tier: str                      # 'basic', 'standard', 'premium'
    city: str                      # 'bangalore', 'mumbai', etc
    month: int                     # 1-12

class PremiumResponse(BaseModel):
    premium: int                   # final premium in Rs
    explainer: str                 # human-readable card
    breakdown: dict                # individual adjustments

@app.post('/api/premium/calculate', response_model=PremiumResponse)
def calculate_premium(req: PremiumRequest):
    # One-hot encode tier
    tier_basic = 1 if req.tier == 'basic' else 0
    tier_standard = 1 if req.tier == 'standard' else 0
    tier_premium = 1 if req.tier == 'premium' else 0

    # One-hot encode city
    cities = ['bangalore','mumbai','delhi','chennai','hyderabad']
    city_enc = {c: (1 if req.city.lower() == c else 0) for c in cities}

    features = pd.DataFrame([{
        'zone_risk_score': req.zone_risk_score,
        'earnings_baseline': req.earnings_baseline,
        'trust_score': req.trust_score,
        'past_claims_count': req.past_claims_count,
        'claim_approval_rate': req.claim_approval_rate,
        'weeks_active': req.weeks_active,
        'forecast_rain_mm': req.forecast_rain_mm,
        'forecast_aqi': req.forecast_aqi,
        'tier_basic': tier_basic,
        'tier_standard': tier_standard,
        'tier_premium': tier_premium,
        'city_bangalore': city_enc['bangalore'],
        'city_mumbai': city_enc['mumbai'],
        'city_delhi': city_enc['delhi'],
        'city_chennai': city_enc['chennai'],
        'city_hyderabad': city_enc['hyderabad'],
        'month': req.month
    }])

    raw_premium = premium_model.predict(features)[0]

    # Clip to tier bounds
    bounds = {'basic': (79,129), 'standard': (149,199), 'premium': (249,349)}
    lo, hi = bounds[req.tier]
    final_premium = int(np.clip(raw_premium, lo, hi))

    # Calculate adjustments for explainer
    base = {'basic': 99, 'standard': 149, 'premium': 249}[req.tier]
    risk_label = 'HIGH' if req.zone_risk_score > 65 else ('MEDIUM' if req.zone_risk_score > 35 else 'LOW')
    risk_adj = round((req.zone_risk_score / 100) * 30)
    trust_adj = -15 if req.trust_score > 85 else (-8 if req.trust_score > 70 else 0)
    rain_adj = min(round(req.forecast_rain_mm * 0.5), 15)
    other_adj = final_premium - base - risk_adj - trust_adj - rain_adj

    explainer = (
        f"Base ({req.tier.capitalize()}): \u20b9{base}. "
        f"Zone risk {risk_label}: {risk_adj:+}. "
        f"Trust score ({req.trust_score}): {trust_adj:+}. "
        f"Rain forecast ({req.forecast_rain_mm:.0f}mm): {rain_adj:+}. "
        f"Other adjustments: {other_adj:+}. "
        f"Final: \u20b9{final_premium}"
    )

    return PremiumResponse(
        premium=final_premium,
        explainer=explainer,
        breakdown={
            'base': base,
            'zone_risk_adj': risk_adj,
            'trust_adj': trust_adj,
            'rain_adj': rain_adj,
            'other_adj': other_adj,
            'final': final_premium
        }
    )

# =====================
# FRAUD ENDPOINT
# =====================

class FraudRequest(BaseModel):
    trust_score: int
    gps_speed_kmph: float
    gps_jump_km: float
    gps_in_zone: int               # 0 or 1
    api_confirmed: int             # 0 or 1
    same_event_claims_count: int
    pincode_changes_30days: int
    weekly_claims: int
    avg_weekly_claims: float
    claim_spike_ratio: float
    payout_amount: float
    earnings_baseline: float
    payout_vs_baseline_ratio: float
    hours_since_last_claim: float
    zone_disruption_confirmed: int # 0 or 1
    neighbor_zone_payout: int      # 0 or 1

class FraudResponse(BaseModel):
    fraud_score: float             # 0-100
    risk_level: str                # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    auto_action: str               # 'APPROVE', 'REVIEW', 'REJECT'
    flags: List[str]               # list of triggered fraud patterns

@app.post('/api/fraud/score', response_model=FraudResponse)
def score_fraud(req: FraudRequest):
    features = pd.DataFrame([req.dict()])
    raw_score = fraud_model.predict(features)[0]
    fraud_score = float(np.clip(raw_score, 0, 100))

    # Determine risk level and auto action
    if fraud_score < 20:
        risk_level, auto_action = 'LOW', 'APPROVE'
    elif fraud_score < 50:
        risk_level, auto_action = 'MEDIUM', 'REVIEW'
    elif fraud_score < 75:
        risk_level, auto_action = 'HIGH', 'REVIEW'
    else:
        risk_level, auto_action = 'CRITICAL', 'REJECT'

    # Override: low trust always goes to review
    if req.trust_score < 60 and auto_action == 'APPROVE':
        auto_action = 'REVIEW'

    # Generate fraud flags
    flags = []
    if req.gps_speed_kmph > 100:
        flags.append('GPS_SPOOFING: Speed > 100kmph detected')
    if req.gps_jump_km > 5:
        flags.append('GPS_SPOOFING: Location jump > 5km detected')
    if req.gps_in_zone == 0:
        flags.append('OFF_ZONE: Worker GPS outside disruption zone')
    if req.api_confirmed == 0:
        flags.append('UNCONFIRMED: No external API confirmed this disruption')
    if req.same_event_claims_count > 1:
        flags.append(f'RAIN_CHASER: {req.same_event_claims_count} claims for same Event ID')
    if req.pincode_changes_30days > 2:
        flags.append(f'ZONE_HOPPER: {req.pincode_changes_30days} pincode changes in 30 days')
    if req.claim_spike_ratio > 3:
        flags.append(f'CLAIM_SPIKE: {req.claim_spike_ratio:.1f}x normal claim rate')
    if req.neighbor_zone_payout == 1:
        flags.append('RAIN_CHASER: Already claimed in adjacent zone today')

    return FraudResponse(
        fraud_score=round(fraud_score, 1),
        risk_level=risk_level,
        auto_action=auto_action,
        flags=flags
    )

@app.get('/health')
def health():
    return {'status': 'ok', 'models': ['premium', 'fraud']}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8001)