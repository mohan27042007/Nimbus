import { PremiumInputs, PremiumResult, PremiumExplanationLine } from "../types";

const BASE_RATES: Record<string, number> = {
  basic: 99,
  standard: 179,
  premium: 299,
};

function getCityAdjustment(city: string): number {
  const c = city.toLowerCase();
  switch (c) {
    case "mumbai": return 10;
    case "delhi": return 12;
    case "chennai": return 4;
    case "hyderabad": return 3;
    case "bangalore": return 0;
    default: return 0;
  }
}

function getZoneRisk(zone: string): { riskLevel: "low" | "medium" | "high", adjustment: number } {
  const z = zone.toLowerCase();
  if (z.includes("koramangala")) return { riskLevel: "high", adjustment: 20 };
  if (z.includes("hsr")) return { riskLevel: "medium", adjustment: 15 };
  if (z.includes("indiranagar")) return { riskLevel: "medium", adjustment: 12 };
  if (z.includes("whitefield")) return { riskLevel: "medium", adjustment: 10 };
  
  return { riskLevel: "low", adjustment: 0 };
}

function getTrustDiscount(score?: number): number {
  const ts = score ?? 75; // Default score
  if (ts >= 80) return 10;
  if (ts >= 60) return 5;
  return 0;
}

export function calculatePremium(inputs: PremiumInputs): PremiumResult {
  const basePremium = BASE_RATES[inputs.tierId] || 179;
  
  const cityAdjustment = getCityAdjustment(inputs.city);
  const { riskLevel, adjustment: zoneAdjustment } = getZoneRisk(inputs.zone);
  const trustDiscount = getTrustDiscount(inputs.trustScore);

  let finalPremium = basePremium + cityAdjustment + zoneAdjustment - trustDiscount;
  
  // Safety rule: clamp minimum premium so it doesn't fall below a sensible floor
  const floor = basePremium - 15;
  if (finalPremium < floor) {
    finalPremium = floor;
  }

  const explanation: PremiumExplanationLine[] = [
    {
      label: `Base Premium (${inputs.tierId})`,
      type: "base",
      amount: basePremium,
      displayValue: `₹${basePremium}`
    }
  ];

  if (cityAdjustment > 0) {
    explanation.push({
      label: `City Adjustment (${inputs.city})`,
      type: "adjustment",
      amount: cityAdjustment,
      displayValue: `+₹${cityAdjustment}`
    });
  }

  if (zoneAdjustment > 0) {
    explanation.push({
      label: `Zone Risk (${inputs.zone} - ${riskLevel})`,
      type: "adjustment",
      amount: zoneAdjustment,
      displayValue: `+₹${zoneAdjustment}`
    });
  }

  if (trustDiscount > 0) {
    explanation.push({
      label: "Trust Score Discount",
      type: "discount",
      amount: trustDiscount,
      displayValue: `-₹${trustDiscount}`
    });
  }

  explanation.push({
    label: "Final Weekly Premium",
    type: "final",
    amount: finalPremium,
    displayValue: `₹${finalPremium}`
  });

  return {
    basePremium,
    finalPremium,
    riskLevel,
    zoneAdjustment,
    cityAdjustment,
    trustDiscount,
    explanation
  };
}
