import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Shield, Star, MapPin, ArrowRight, IndianRupee, Loader2 } from "lucide-react";

import { Claim, DisruptionEvent, Payout, Policy, Worker } from "@/types";

interface WorkerData {
  worker: Worker;
  policy: Policy | null;
  claims: Claim[];
  payouts: Payout[];
}

const Dashboard = () => {
  const [data, setData] = useState<WorkerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoneRisk, setZoneRisk] = useState<{ level: string; message: string }>({ level: "MEDIUM", message: "Moderate conditions expected" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get first worker (demo - Rajan)
      const { data: workers } = await supabase.from("workers").select("*").order("created_at", { ascending: true }).limit(1);
      if (!workers?.length) { setLoading(false); return; }
      const worker = workers[0] as Worker;

      const [policiesRes, claimsRes, payoutsRes, disruptionsRes] = await Promise.all([
        supabase.from("policies").select("*").eq("worker_id", worker.id).eq("status", "active").limit(1),
        supabase.from("claims").select("*, disruptions(type, severity)").eq("worker_id", worker.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("payouts").select("*").eq("worker_id", worker.id).order("created_at", { ascending: false }).limit(3),
        supabase.from("disruptions").select("*").eq("zone", worker.zone).eq("status", "active"),
      ]);

      // Determine zone risk from active disruptions
      const activeDisruptions = (disruptionsRes.data as DisruptionEvent[]) || [];
      if (activeDisruptions.some((d: DisruptionEvent) => d.severity === "high")) {
        setZoneRisk({ level: "HIGH", message: "Heavy rain forecast tomorrow" });
      } else if (activeDisruptions.some((d: DisruptionEvent) => d.severity === "medium")) {
        setZoneRisk({ level: "MEDIUM", message: "Moderate conditions expected" });
      } else {
        setZoneRisk({ level: "LOW", message: "Clear conditions expected" });
      }

      setData({
        worker,
        policy: (policiesRes.data?.[0] as Policy) || null,
        claims: (claimsRes.data as Claim[]) || [],
        payouts: (payoutsRes.data as Payout[]) || [],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!data?.worker) return (
    <div className="mx-auto max-w-6xl px-4 py-12 text-center space-y-4">
      <h2 className="text-2xl font-semibold">No worker profile found</h2>
      <p className="text-muted-foreground">Get started by creating your profile.</p>
      <Button asChild><Link to="/onboard">Get Coverage <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
    </div>
  );

  const { worker, policy, payouts } = data;
  const riskColor = zoneRisk.level === "HIGH" ? "text-destructive" : zoneRisk.level === "MEDIUM" ? "text-warning" : "text-success";
  const riskEmoji = zoneRisk.level === "HIGH" ? "🔴" : zoneRisk.level === "MEDIUM" ? "🟡" : "🟢";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Hey {(worker.name || "Worker").split(" ")[0]} 👋</h1>
        <p className="text-muted-foreground">{worker.zone} — {worker.pincode}, {worker.city}</p>
      </div>

      {/* Stat cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Coverage */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <div className="flex items-center gap-2 text-success">
            <Shield className="h-5 w-5" />
            <span className="font-semibold">Coverage Active ✅</span>
          </div>
          {policy ? (
            <div className="space-y-1 text-sm">
              <p>Plan: <span className="font-medium capitalize">{policy.tier}</span> | Premium: <span className="font-medium text-primary">₹{policy.weekly_premium}/week</span></p>
              <p>Max payout: <span className="font-medium">₹{Number(policy.max_payout).toLocaleString()}</span></p>
              <p>Renewal: <span className="font-medium">{policy.renewal_date}</span></p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active policy</p>
          )}
        </div>

        {/* Trust Score */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <span className="font-semibold">Trust Score</span>
          </div>
          <p className="text-3xl font-bold">{worker.trust_score}<span className="text-lg text-muted-foreground">/100</span> ⭐</p>
          <Progress value={worker.trust_score} className="h-2" />
          <p className="text-xs text-muted-foreground">Clean claim history</p>
        </div>

        {/* Zone Risk */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="font-semibold">Zone Risk</span>
          </div>
          <p className="text-sm font-medium">{worker.zone} — {worker.pincode}</p>
          <span className={`inline-block text-sm font-semibold ${riskColor}`}>
            {riskEmoji} {zoneRisk.level}
          </span>
          <p className="text-xs text-muted-foreground">{zoneRisk.message}</p>
        </div>
      </div>

      {/* Middle section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Payouts */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Recent Payouts</h3>
          {payouts.length > 0 ? (
            <div className="space-y-3">
              {payouts.map((p: Payout) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-success" />
                    <span className="font-medium">₹{Number(p.amount).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.status === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    }`}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No payouts yet. When Nimbus detects a disruption in your zone, your first payout will appear here.</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/policy">View Policy <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/claims">View Claims <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
