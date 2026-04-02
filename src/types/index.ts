export type PolicyTier = "basic" | "standard" | "premium";
export type PolicyStatus = "active" | "inactive" | "cancelled";
export type DisruptionSeverity = "high" | "medium" | "low";
export type ClaimStatus = "paid" | "rejected" | "pending" | "processing";
export type PayoutStatus = "paid" | "rejected" | "pending";

export type TriggerType = "rain" | "heat" | "flood" | "aqi" | "curfew" | "platform_drop" | "gps_dead_zone" | string;

export interface Worker {
  id: string;
  user_id?: string;
  name: string;
  phone: string;
  swiggy_id: string;
  zone: string;
  pincode: string;
  city: string;
  trust_score: number;
  earnings_baseline: number;
  upi_id: string;
  created_at?: string;
}

export interface Policy {
  id: string;
  worker_id: string;
  tier: PolicyTier;
  weekly_premium: number;
  max_payout: number;
  status: PolicyStatus;
  start_date: string;
  end_date?: string;
  renewal_date?: string;
  created_at?: string;
}

export interface DisruptionEvent {
  id: string;
  event_id: string;
  type: TriggerType;
  zone: string;
  pincode: string;
  severity: DisruptionSeverity;
  reading: string | number;
  threshold: string | number;
  status: string;
  triggered_at?: string;
  created_at?: string;
}

export interface Claim {
  id: string;
  worker_id: string;
  disruption_id: string;
  payout_amount: number;
  baseline_earnings: number;
  protection_percentage: number;
  explainer_text: string | null;
  fraud_flag: boolean;
  status: ClaimStatus;
  created_at?: string;
  
  // Relations from Supabase joined queries
  workers?: Partial<Worker> | null;
  disruptions?: Partial<DisruptionEvent> | null;
}

export interface Payout {
  id: string;
  claim_id: string;
  worker_id: string;
  amount: number;
  upi_id: string;
  status: PayoutStatus;
  created_at: string;
}

export interface FraudQueueItem extends Claim {
  workers: Partial<Worker>;
}

export type ExplanationLineType = "base" | "adjustment" | "discount" | "final";

export interface PremiumExplanationLine {
  label: string;
  type: ExplanationLineType;
  amount: number;
  displayValue: string;
}

export interface PremiumInputs {
  tierId: string;
  city: string;
  zone: string;
  pincode: string;
  trustScore?: number;
}

export interface PremiumResult {
  basePremium: number;
  finalPremium: number;
  riskLevel: "low" | "medium" | "high";
  zoneAdjustment: number;
  cityAdjustment: number;
  trustDiscount: number;
  explanation: PremiumExplanationLine[];
}

export interface PayoutExplanation {
  disruption_severity: DisruptionSeverity;
  baseline_earnings: number;
  protection_percentage: number;
  final_amount: number;
  calculation_steps: string[];
}

export interface ZoneRiskSummary {
  zone: string;
  pincode: string;
  current_risk_level: "low" | "medium" | "high";
  active_alerts: number;
  conditions: string;
}

export interface AdminChartPoint {
  week: string;
  premiums: number;
  payouts: number;
}

export interface WeeklyStat {
  week: string;
  value: number;
}
