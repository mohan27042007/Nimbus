import pandas as pd
import numpy as np

np.random.seed(123)
N = 12000

# Generate legitimate claims (80% of data)
n_legit = int(N * 0.80)
# Generate fraudulent claims (20% of data)
n_fraud = N - n_legit

def gen_legitimate(n):
    return pd.DataFrame({
        'trust_score': np.random.randint(70, 100, n),
        'gps_speed_kmph': np.random.uniform(0, 45, n),
        'gps_jump_km': np.random.uniform(0, 2, n),
        'gps_in_zone': np.ones(n, dtype=int),
        'api_confirmed': np.ones(n, dtype=int),
        'same_event_claims_count': np.ones(n, dtype=int),
        'pincode_changes_30days': np.random.randint(0, 2, n),
        'weekly_claims': np.random.randint(0, 3, n),
        'avg_weekly_claims': np.random.uniform(0.5, 2.0, n),
        'claim_spike_ratio': np.random.uniform(0.5, 1.5, n),
        'payout_amount': np.random.uniform(200, 800, n),
        'earnings_baseline': np.random.uniform(600, 1500, n),
        'payout_vs_baseline_ratio': np.random.uniform(0.2, 0.9, n),
        'hours_since_last_claim': np.random.uniform(24, 720, n),
        'zone_disruption_confirmed': np.ones(n, dtype=int),
        'neighbor_zone_payout': np.zeros(n, dtype=int),
        'fraud_risk_score': np.random.randint(0, 20, n)  # 0-20 for legit
    })

def gen_fraudulent(n):
    # Mix of fraud types
    return pd.DataFrame({
        'trust_score': np.random.randint(20, 70, n),
        'gps_speed_kmph': np.random.choice(
            [np.random.uniform(0,45), np.random.uniform(120,200)],
            n
        ),
        'gps_jump_km': np.random.choice(
            [np.random.uniform(0,2), np.random.uniform(6,25)],
            n
        ),
        'gps_in_zone': np.random.choice([0,1], n, p=[0.6, 0.4]),
        'api_confirmed': np.random.choice([0,1], n, p=[0.5, 0.5]),
        'same_event_claims_count': np.random.randint(1, 5, n),
        'pincode_changes_30days': np.random.randint(2, 8, n),
        'weekly_claims': np.random.randint(3, 12, n),
        'avg_weekly_claims': np.random.uniform(0.2, 1.0, n),
        'claim_spike_ratio': np.random.uniform(3.0, 8.0, n),
        'payout_amount': np.random.uniform(500, 2000, n),
        'earnings_baseline': np.random.uniform(300, 800, n),
        'payout_vs_baseline_ratio': np.random.uniform(1.5, 4.0, n),
        'hours_since_last_claim': np.random.uniform(0, 12, n),
        'zone_disruption_confirmed': np.random.choice([0,1], n, p=[0.4,0.6]),
        'neighbor_zone_payout': np.random.choice([0,1], n, p=[0.3,0.7]),
        'fraud_risk_score': np.random.randint(70, 100, n)  # 70-100 for fraud
    })

df_legit = gen_legitimate(n_legit)
df_fraud = gen_fraudulent(n_fraud)
df = pd.concat([df_legit, df_fraud], ignore_index=True)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)  # shuffle

df.to_csv('nimbus_fraud_training_data.csv', index=False)
print(f'Generated {N} rows: {n_legit} legitimate, {n_fraud} fraudulent')
print(df.describe())