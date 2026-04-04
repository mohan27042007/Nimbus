import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import matplotlib.pyplot as plt
import shap

df = pd.read_csv('nimbus_fraud_training_data.csv')

FEATURES = [
    'trust_score', 'gps_speed_kmph', 'gps_jump_km',
    'gps_in_zone', 'api_confirmed', 'same_event_claims_count',
    'pincode_changes_30days', 'weekly_claims', 'avg_weekly_claims',
    'claim_spike_ratio', 'payout_amount', 'earnings_baseline',
    'payout_vs_baseline_ratio', 'hours_since_last_claim',
    'zone_disruption_confirmed', 'neighbor_zone_payout'
]
TARGET = 'fraud_risk_score'

X = df[FEATURES]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = xgb.XGBRegressor(
    n_estimators=400,
    max_depth=5,
    learning_rate=0.08,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=5,
    gamma=0.2,
    reg_alpha=0.5,
    reg_lambda=1.5,
    tree_method='hist',
    device='cuda',
    eval_metric='mae',
    early_stopping_rounds=40,
    random_state=42
)

model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=50
)

y_pred = model.predict(X_test)
y_pred_clipped = np.clip(y_pred, 0, 100)

mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f'\n=== FRAUD MODEL PERFORMANCE ===')
print(f'MAE: {mae:.2f}  (target: < 5)')
print(f'R2 Score: {r2:.4f}  (target: > 0.93)')

# ---- APPLIED FIX: Prevent the sklearn metadata error ----
model._estimator_type = "regressor"
model.save_model('nimbus_fraud_model.json')
print('Model saved: nimbus_fraud_model.json')

# ---- APPLIED FIX: Prevent the matplotlib figsize error ----
fig, ax = plt.subplots(figsize=(10, 6))
xgb.plot_importance(model, max_num_features=10, ax=ax)
plt.title('Nimbus Fraud Model — Feature Importance')
plt.tight_layout()
plt.savefig('fraud_feature_importance.png', dpi=150)

# Test with known fraud case
sample_fraud = pd.DataFrame([{
    'trust_score': 45,
    'gps_speed_kmph': 145.0,
    'gps_jump_km': 8.5,
    'gps_in_zone': 0,
    'api_confirmed': 0,
    'same_event_claims_count': 3,
    'pincode_changes_30days': 4,
    'weekly_claims': 7,
    'avg_weekly_claims': 0.8,
    'claim_spike_ratio': 8.75,
    'payout_amount': 1800,
    'earnings_baseline': 500,
    'payout_vs_baseline_ratio': 3.6,
    'hours_since_last_claim': 2.0,
    'zone_disruption_confirmed': 0,
    'neighbor_zone_payout': 1
}])
fraud_score = np.clip(model.predict(sample_fraud)[0], 0, 100)
print(f'Known fraud case score: {fraud_score:.1f}/100  (expected: > 80)')

# Test with known legit case (Rajan)
sample_legit = pd.DataFrame([{
    'trust_score': 87,
    'gps_speed_kmph': 22.0,
    'gps_jump_km': 0.3,
    'gps_in_zone': 1,
    'api_confirmed': 1,
    'same_event_claims_count': 1,
    'pincode_changes_30days': 0,
    'weekly_claims': 1,
    'avg_weekly_claims': 0.8,
    'claim_spike_ratio': 1.25,
    'payout_amount': 600,
    'earnings_baseline': 1000,
    'payout_vs_baseline_ratio': 0.6,
    'hours_since_last_claim': 168.0,
    'zone_disruption_confirmed': 1,
    'neighbor_zone_payout': 0
}])
legit_score = np.clip(model.predict(sample_legit)[0], 0, 100)
print(f'Rajan legit case score: {legit_score:.1f}/100  (expected: < 15)')