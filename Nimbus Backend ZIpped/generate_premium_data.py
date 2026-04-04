import pandas as pd
import numpy as np
from datetime import datetime

np.random.seed(42)
N = 15000  # 15,000 training samples

# Generate base features
zone_risk = np.random.randint(10, 95, N)
earnings = np.random.uniform(400, 2500, N)
trust = np.random.randint(50, 100, N)
claims_count = np.random.randint(0, 15, N)
approval_rate = np.clip(np.random.normal(0.85, 0.15, N), 0, 1)
weeks = np.random.randint(1, 52, N)
rain_forecast = np.random.exponential(10, N)  # skewed — most days little rain
aqi_forecast = np.random.randint(30, 350, N)
month = np.random.randint(1, 13, N)

# One-hot encode tier (random assignment weighted to Standard)
tier_probs = [0.25, 0.50, 0.25]  # 25% basic, 50% standard, 25% premium
tiers = np.random.choice(['basic', 'standard', 'premium'], N, p=tier_probs)
tier_basic = (tiers == 'basic').astype(int)
tier_standard = (tiers == 'standard').astype(int)
tier_premium = (tiers == 'premium').astype(int)

# One-hot encode city
cities = np.random.choice(
    ['bangalore', 'mumbai', 'delhi', 'chennai', 'hyderabad'], N,
    p=[0.35, 0.25, 0.20, 0.10, 0.10]
)
city_b = (cities == 'bangalore').astype(int)
city_m = (cities == 'mumbai').astype(int)
city_d = (cities == 'delhi').astype(int)
city_c = (cities == 'chennai').astype(int)
city_h = (cities == 'hyderabad').astype(int)

# ---- PREMIUM FORMULA (deterministic base with noise) ----
# Base by tier
base = np.where(tiers == 'basic', 99, np.where(tiers == 'standard', 149, 249))

# Zone risk adjustment: +0 to +30
risk_adj = (zone_risk / 100) * 30

# Trust score discount: high trust = lower premium
trust_adj = -np.where(trust > 85, 15, np.where(trust > 70, 8, 0))

# Claims history penalty
claims_adj = np.minimum(claims_count * 2, 20)  # max +20

# Low approval rate penalty
approval_adj = np.where(approval_rate < 0.7, 15, 0)

# Seasonal adjustment (monsoon months Jun-Sep cost more)
seasonal_adj = np.where(np.isin(month, [6, 7, 8, 9]), 10, 0)

# Weather forecast adjustment
rain_adj = np.minimum(rain_forecast * 0.5, 15)  # max +15
aqi_adj = np.where(aqi_forecast > 200, 8, np.where(aqi_forecast > 100, 4, 0))

# Loyalty discount (longer active = cheaper)
loyalty_adj = -np.minimum(weeks * 0.3, 10)  # max -10

# Final premium with small random noise
premium = base + risk_adj + trust_adj + claims_adj + approval_adj
premium += seasonal_adj + rain_adj + aqi_adj + loyalty_adj
premium += np.random.normal(0, 3, N)  # realistic noise

# Clip to tier bounds
premium = np.where(tiers == 'basic', np.clip(premium, 79, 129), premium)
premium = np.where(tiers == 'standard', np.clip(premium, 149, 199), premium)
premium = np.where(tiers == 'premium', np.clip(premium, 249, 349), premium)
premium = np.round(premium).astype(int)

# Build DataFrame
df = pd.DataFrame({
    'zone_risk_score': zone_risk,
    'earnings_baseline': np.round(earnings, 2),
    'trust_score': trust,
    'past_claims_count': claims_count,
    'claim_approval_rate': np.round(approval_rate, 3),
    'weeks_active': weeks,
    'forecast_rain_mm': np.round(rain_forecast, 2),
    'forecast_aqi': aqi_forecast,
    'tier_basic': tier_basic,
    'tier_standard': tier_standard,
    'tier_premium': tier_premium,
    'city_bangalore': city_b,
    'city_mumbai': city_m,
    'city_delhi': city_d,
    'city_chennai': city_c,
    'city_hyderabad': city_h,
    'month': month,
    'recommended_weekly_premium': premium
})

df.to_csv('nimbus_premium_training_data.csv', index=False)
print(f'Generated {N} rows')
print(df.describe())
print(f'Premium range: {df.recommended_weekly_premium.min()} — {df.recommended_weekly_premium.max()}')
print(df.head())