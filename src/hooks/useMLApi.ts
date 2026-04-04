import { useState } from 'react'

const ML_API_BASE = import.meta.env.VITE_ML_API_BASE_URL || 'http://localhost:8000'

export interface PremiumRequest {
  zone_risk_score: number
  earnings_baseline: number
  trust_score: number
  past_claims_count: number
  claim_approval_rate: number
  weeks_active: number
  forecast_rain_mm: number
  forecast_aqi: number
  tier: string
  city: string
  month: number
}

export interface PremiumResponse {
  premium: number
  explainer: string
  breakdown: {
    base: number
    zone_risk_adj: number
    trust_adj: number
    rain_adj: number
    other_adj: number
    final: number
  }
}

export interface FraudRequest {
  trust_score: number
  gps_speed_kmph: number
  gps_jump_km: number
  gps_in_zone: number
  api_confirmed: number
  same_event_claims_count: number
  pincode_changes_30days: number
  weekly_claims: number
  avg_weekly_claims: number
  claim_spike_ratio: number
  payout_amount: number
  earnings_baseline: number
  payout_vs_baseline_ratio: number
  hours_since_last_claim: number
  zone_disruption_confirmed: number
  neighbor_zone_payout: number
}

export interface FraudResponse {
  fraud_score: number
  risk_level: string
  auto_action: string
  flags: string[]
}

export async function checkMLHealth(): Promise<boolean> {
  try {
    const resp = await fetch(`${ML_API_BASE}/health`, { 
      signal: AbortSignal.timeout(3000) 
    })
    if (!resp.ok) return false
    const data = await resp.json()
    return data.ml_service === 'connected'
  } catch {
    return false
  }
}

export async function fetchMLPremium(
  req: PremiumRequest
): Promise<PremiumResponse | null> {
  try {
    const resp = await fetch(`${ML_API_BASE}/api/premium/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(10000)
    })
    if (!resp.ok) return null
    return await resp.json()
  } catch {
    return null
  }
}

export async function fetchMLFraudScore(
  req: FraudRequest
): Promise<FraudResponse | null> {
  try {
    const resp = await fetch(`${ML_API_BASE}/api/fraud/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(10000)
    })
    if (!resp.ok) return null
    return await resp.json()
  } catch {
    return null
  }
}

export function useMLStatus() {
  const [mlOnline, setMlOnline] = useState<boolean | null>(null)

  const checkStatus = async () => {
    const online = await checkMLHealth()
    setMlOnline(online)
  }

  return { mlOnline, checkStatus }
}