/** Zone risk scores by pincode (prompt spec). Default 50 if unknown. */
const PINCODE_ZONE_RISK: Record<string, number> = {
  "560034": 75, // Koramangala
  "560102": 35, // Whitefield
  "560068": 60, // HSR Layout
  "560001": 50, // MG Road
  "400001": 70, // Mumbai CST
  "110001": 55, // Delhi CP
  "600001": 65, // Chennai
  "500001": 45, // Hyderabad
};

export function getZoneRiskScore(pincode: string | null | undefined): number {
  if (!pincode) return 50;
  const normalized = pincode.replace(/\s/g, "");
  return PINCODE_ZONE_RISK[normalized] ?? 50;
}

export function riskLevelLabel(score: number): "LOW" | "MEDIUM" | "HIGH" {
  if (score < 35) return "LOW";
  if (score <= 65) return "MEDIUM";
  return "HIGH";
}
