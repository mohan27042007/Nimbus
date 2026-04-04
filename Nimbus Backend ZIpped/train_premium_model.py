import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import matplotlib.pyplot as plt
import shap
import json

# Load data
df = pd.read_csv('nimbus_premium_training_data.csv')

FEATURES = [
    'zone_risk_score', 'earnings_baseline', 'trust_score',
    'past_claims_count', 'claim_approval_rate', 'weeks_active',
    'forecast_rain_mm', 'forecast_aqi', 'tier_basic',
    'tier_standard', 'tier_premium', 'city_bangalore',
    'city_mumbai', 'city_delhi', 'city_chennai',
    'city_hyderabad', 'month'
]
TARGET = 'recommended_weekly_premium'

X = df[FEATURES]
y = df[TARGET]

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f'Training samples: {len(X_train)}')
print(f'Test samples: {len(X_test)}')

# ---- TRAIN XGBOOST ----
model = xgb.XGBRegressor(
    n_estimators=500,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=3,
    gamma=0.1,
    reg_alpha=0.1,
    reg_lambda=1.0,
    tree_method='hist',
    device='cuda',      # Uses your RTX 3050 GPU automatically
    eval_metric='mae',
    early_stopping_rounds=50,
    random_state=42
)

model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=50
)

# ---- EVALUATE ----
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f'\n=== MODEL PERFORMANCE ===')
print(f'MAE: ₹{mae:.2f}  (target: < ₹8)')
print(f'R2 Score: {r2:.4f}  (target: > 0.95)')

# ---- SAVE MODEL ----
model._estimator_type = "regressor" 
model.save_model('nimbus_premium_model.json')
print('Model saved: nimbus_premium_model.json')

# ---- FEATURE IMPORTANCE PLOT ----
fig, ax = plt.subplots(figsize=(10, 6))
xgb.plot_importance(model, max_num_features=10, ax=ax)
plt.title('Nimbus Premium Model — Feature Importance')
plt.tight_layout()
plt.savefig('premium_feature_importance.png', dpi=150)
print('Feature importance plot saved: premium_feature_importance.png')

# ---- SHAP EXPLAINABILITY ----
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test[:100])
shap.summary_plot(shap_values, X_test[:100], show=False)
plt.savefig('premium_shap_summary.png', dpi=150, bbox_inches='tight')
print('SHAP plot saved: premium_shap_summary.png')

# ---- VERIFY SAMPLE PREDICTION ----
sample = pd.DataFrame([{
    'zone_risk_score': 75,
    'earnings_baseline': 1000,
    'trust_score': 87,
    'past_claims_count': 2,
    'claim_approval_rate': 1.0,
    'weeks_active': 8,
    'forecast_rain_mm': 25.0,
    'forecast_aqi': 120,
    'tier_basic': 0,
    'tier_standard': 1,
    'tier_premium': 0,
    'city_bangalore': 1,
    'city_mumbai': 0,
    'city_delhi': 0,
    'city_chennai': 0,
    'city_hyderabad': 0,
    'month': 7
}])

pred = model.predict(sample)[0]
print(f'\nSample prediction (Rajan): ₹{pred:.0f}/week')
print('Expected: ~₹179-199 (Standard tier, Koramangala, monsoon month)')