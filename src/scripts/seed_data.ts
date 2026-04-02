import { createClient } from "@supabase/supabase-js";
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env if run directly with ts-node
dotenv.config({ path: resolve(process.cwd(), '.env') });
// fallback to standard variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Seeding Demo Data...");

  // 1. Seed Disruptions
  const disruptions = [
    {
      event_id: `EVT-BLR-RAIN-${Date.now()}`,
      type: "rain",
      zone: "Koramangala",
      pincode: "560034",
      severity: "high",
      reading: "65mm/hr",
      threshold: "50mm/hr",
      status: "active",
      triggered_at: new Date().toISOString()
    },
    {
      event_id: `EVT-BLR-FLOOD-${Date.now()}`,
      type: "flood",
      zone: "Koramangala",
      pincode: "560034",
      severity: "high",
      reading: "Water Logging",
      threshold: "Alert",
      status: "active",
      triggered_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      event_id: `EVT-BLR-AQI-${Date.now()}`,
      type: "aqi",
      zone: "Indiranagar",
      pincode: "560038",
      severity: "medium",
      reading: "350 AQI",
      threshold: "300 AQI",
      status: "active",
      triggered_at: new Date().toISOString()
    },
    {
      event_id: `EVT-MUM-RAIN-${Date.now()}`,
      type: "rain",
      zone: "Andheri",
      pincode: "400053",
      severity: "high",
      reading: "80mm/hr",
      threshold: "50mm/hr",
      status: "active",
      triggered_at: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  for (const d of disruptions) {
    const { error } = await supabase.from("disruptions").insert(d);
    if (error) console.error("Error inserting disruption:", error);
  }
  console.log(`✅ Seeded ${disruptions.length} disruption events.`);

  // 2. Setup "Rajan Kumar" Worker + Policy + Claim + Payout story
  // We'll see if Rajan exists, if not, create him.
  const { data: existingRajan } = await supabase.from("workers")
    .select("*").eq("phone", "+91 9876543210").limit(1).single();

  let workerId = existingRajan?.id;

  if (!workerId) {
    const { data: newWorker, error: wErr } = await supabase.from("workers").insert({
      name: "Rajan Kumar",
      phone: "+91 9876543210",
      swiggy_id: "SWG-BLR-RAJAN",
      city: "Bangalore",
      zone: "Koramangala",
      pincode: "560034",
      trust_score: 100,
      earnings_baseline: 1200,
      upi_id: "rajan@ybl"
    }).select().single();

    if (wErr) {
      console.error("Error creating Rajan:", wErr);
      return;
    }
    workerId = newWorker.id;

    // Create his policy
    await supabase.from("policies").insert({
      worker_id: workerId,
      tier: "standard",
      weekly_premium: 179,
      max_payout: 1000,
      status: "active",
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0]
    });
    console.log("✅ Created Rajan Kumar and Policy.");
  }

  // Find the rain disruption we just inserted to link the claim
  const { data: rainDisruption } = await supabase.from("disruptions")
    .select("id").eq("type", "rain").eq("zone", "Koramangala").order("triggered_at", { ascending: false }).limit(1).single();
  
  if (rainDisruption && workerId) {
    const { data: claim, error: cErr } = await supabase.from("claims").insert({
      worker_id: workerId,
      disruption_id: rainDisruption.id,
      payout_amount: 600,
      baseline_earnings: 1200,
      protection_percentage: 50,
      explainer_text: "Severe rain detected (>65mm/hr) in Koramangala triggering 50% shift protection.",
      fraud_flag: false,
      status: "paid"
    }).select().single();

    if (cErr) {
      console.error("Error creating claim:", cErr);
    } else {
      console.log("✅ Created Claim for Rajan.");
      // Create Payout
      await supabase.from("payouts").insert({
        claim_id: claim.id,
        worker_id: workerId,
        amount: 600,
        upi_id: "rajan@ybl",
        status: "paid"
      });
      console.log("✅ Created Payout of ₹600 for Rajan.");
    }
  }

  console.log("🎉 Seeding complete.");
}

seed();
