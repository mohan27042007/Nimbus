export type PremiumTier = "basic" | "standard" | "premium";

/**
 * Deterministic premium (prompt spec). Same inputs → same output.
 */
export function calculatePremium(
  zone_risk: number,
  _earnings: number,
  trust_score: number,
  tier: PremiumTier,
  forecast_rain: number,
  forecast_aqi: number,
  month: number
): { premium: number; explainer: string } {
  const base = { basic: 99, standard: 149, premium: 249 }[tier];

  const risk_adj = Math.round((zone_risk / 100) * 30);

  const trust_adj = trust_score > 85 ? -15 : trust_score > 70 ? -8 : 0;

  const rain_adj = Math.min(Math.round(forecast_rain * 0.5), 15);

  const aqi_adj = forecast_aqi > 200 ? 8 : forecast_aqi > 100 ? 4 : 0;

  const seasonal_adj = [6, 7, 8, 9].includes(month) ? 10 : 0;

  let final =
    base + risk_adj + trust_adj + rain_adj + aqi_adj + seasonal_adj;

  const bounds = {
    basic: [79, 129],
    standard: [149, 199],
    premium: [249, 349],
  } as const;
  final = Math.max(bounds[tier][0], Math.min(bounds[tier][1], final));

  const risk_label =
    zone_risk > 65 ? "HIGH" : zone_risk > 35 ? "MEDIUM" : "LOW";
  const explainer =
    `Base (${tier}): ₹${base}. ` +
    `Zone risk ${risk_label}: +${risk_adj}. ` +
    `Trust score (${trust_score}): ${trust_adj}. ` +
    `Rain forecast (${forecast_rain}mm): +${rain_adj}. ` +
    `Final: ₹${final}`;

  return { premium: final, explainer };
}

export const TIER_MAX_PAYOUT: Record<PremiumTier, number> = {
  basic: 500,
  standard: 1000,
  premium: 2000,
};
