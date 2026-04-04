import { supabase } from "@/integrations/supabase/client";
import { setStoredWorkerId } from "@/lib/workerId";

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * If workers table is empty, insert Rajan + policy + 2 disruptions + 2 claims (+ payouts).
 */
export async function ensureSeedData(): Promise<void> {
  const { count, error: countErr } = await supabase
    .from("workers")
    .select("id", { count: "exact", head: true });

  if (countErr) {
    console.error("ensureSeedData count:", countErr);
    return;
  }

  if ((count ?? 0) > 0) return;

  const today = new Date();
  const end = addDays(today, 7);

  const { data: worker, error: wErr } = await supabase
    .from("workers")
    .insert({
      name: "Rajan Kumar",
      phone: "+91 98765 43210",
      swiggy_id: "SWG-BLR-2847",
      zone: "Koramangala",
      pincode: "560034",
      city: "Bangalore",
      trust_score: 87,
      earnings_baseline: 1000,
      upi_id: "rajan@upi",
    })
    .select()
    .single();

  if (wErr || !worker) {
    console.error("ensureSeedData worker:", wErr);
    return;
  }

  const { error: pErr } = await supabase.from("policies").insert({
    worker_id: worker.id,
    tier: "standard",
    weekly_premium: 179,
    max_payout: 1000,
    status: "active",
    start_date: isoDate(today),
    end_date: isoDate(end),
    renewal_date: isoDate(end),
  });

  if (pErr) console.error("ensureSeedData policy:", pErr);

  const { data: d1, error: d1e } = await supabase
    .from("disruptions")
    .insert({
      event_id: "BLR-24-07",
      type: "rain",
      zone: "Koramangala",
      pincode: "560034",
      severity: "high",
      reading: "28mm/hr",
      threshold: ">20mm/hr",
      triggered_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      status: "active",
    })
    .select()
    .single();

  const { data: d2, error: d2e } = await supabase
    .from("disruptions")
    .insert({
      event_id: "BLR-24-03",
      type: "aqi",
      zone: "Koramangala",
      pincode: "560034",
      severity: "high",
      reading: "AQI 315",
      threshold: "AQI >300",
      triggered_at: new Date(Date.now() - 86400000 * 20).toISOString(),
      status: "active",
    })
    .select()
    .single();

  if (d1e) console.error("ensureSeedData disruption1:", d1e);
  if (d2e) console.error("ensureSeedData disruption2:", d2e);

  if (d1) {
    const { data: c1, error: c1e } = await supabase
      .from("claims")
      .insert({
        worker_id: worker.id,
        disruption_id: d1.id,
        payout_amount: 600,
        baseline_earnings: 1000,
        protection_percentage: 60,
        explainer_text:
          "Event #BLR-24-07: Heavy rain (28mm/hr) + Flood Alert detected in Koramangala. Your Tuesday baseline: ₹1,000. Protected at 60% = ₹600 credited.",
        status: "paid",
        fraud_flag: false,
        approved_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      })
      .select()
      .single();

    if (c1e) console.error("ensureSeedData claim1:", c1e);
    else if (c1) {
      await supabase.from("payouts").insert({
        claim_id: c1.id,
        worker_id: worker.id,
        amount: 600,
        upi_id: "rajan@upi",
        status: "completed",
      });
    }
  }

  if (d2) {
    const { data: c2, error: c2e } = await supabase
      .from("claims")
      .insert({
        worker_id: worker.id,
        disruption_id: d2.id,
        payout_amount: 350,
        baseline_earnings: 1000,
        protection_percentage: 35,
        explainer_text:
          "Event #BLR-24-03: Severe AQI (315) detected in Koramangala. Your baseline: ₹1,000. Protected at 35% = ₹350 credited.",
        status: "paid",
        fraud_flag: false,
        approved_at: new Date(Date.now() - 86400000 * 20).toISOString(),
      })
      .select()
      .single();

    if (c2e) console.error("ensureSeedData claim2:", c2e);
    else if (c2) {
      await supabase.from("payouts").insert({
        claim_id: c2.id,
        worker_id: worker.id,
        amount: 350,
        upi_id: "rajan@upi",
        status: "completed",
      });
    }
  }

  setStoredWorkerId(worker.id);
}
