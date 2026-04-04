import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Shield, Star, MapPin, ArrowRight, IndianRupee, Loader2 } from "lucide-react";

import { Claim, Policy, Worker } from "@/types";
import { resolveWorkerId } from "@/lib/workerId";
import { getZoneRiskScore, riskLevelLabel } from "@/lib/pincodeRisk";

interface WorkerData {
  worker: Worker;
  policy: Policy | null;
  claims: Claim[];
}

const Dashboard = () => {
  const [data, setData] = useState<WorkerData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const workerId = await resolveWorkerId();
      if (!workerId) {
        setData(null);
        return;
      }

      const { data: workerRow, error: wErr } = await supabase.from("workers").select("*").eq("id", workerId).maybeSingle();
      if (wErr || !workerRow) {
        setData(null);
        return;
      }
      const worker = workerRow as Worker;

      const [policiesRes, claimsRes] = await Promise.all([
        supabase.from("policies").select("*").eq("worker_id", worker.id).eq("status", "active").limit(1),
        supabase.from("claims").select("*").eq("worker_id", worker.id).order("created_at", { ascending: false }).limit(3),
      ]);

      setData({
        worker,
        policy: (policiesRes.data?.[0] as Policy) || null,
        claims: (claimsRes.data as Claim[]) || [],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.worker) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-12 text-center">
        <h2 className="text-2xl font-semibold">No worker profile found</h2>
        <p className="text-muted-foreground">Get started by creating your profile.</p>
        <Button asChild>
          <Link to="/onboard">
            Get Coverage <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  const { worker, policy, claims } = data;
  const zoneScore = getZoneRiskScore(worker.pincode);
  const zoneLabel = riskLevelLabel(zoneScore);
  const riskColor =
    zoneLabel === "HIGH" ? "text-destructive" : zoneLabel === "MEDIUM" ? "text-warning" : "text-success";
  const riskEmoji = zoneLabel === "HIGH" ? "🔴" : zoneLabel === "MEDIUM" ? "🟡" : "🟢";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-3xl font-bold">Hey {worker.name || "Worker"} 👋</h1>
        <p className="text-muted-foreground">
          {worker.zone} — {worker.pincode}, {worker.city}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-success">
            <Shield className="h-5 w-5" />
            <span className="font-semibold">Coverage Active ✅</span>
          </div>
          {policy ? (
            <div className="space-y-1 text-sm">
              <p>
                Plan: <span className="font-medium capitalize">{policy.tier}</span> | Premium:{" "}
                <span className="font-medium text-primary">₹{policy.weekly_premium}/week</span>
              </p>
              <p>
                Max payout: <span className="font-medium">₹{Number(policy.max_payout).toLocaleString()}</span>
              </p>
              <p>
                Renewal: <span className="font-medium">{policy.renewal_date}</span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active policy</p>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <span className="font-semibold">Trust Score</span>
          </div>
          <p className="text-3xl font-bold">
            {worker.trust_score}
            <span className="text-lg text-muted-foreground">/100</span> ⭐
          </p>
          <Progress value={worker.trust_score ?? 0} className="h-2" />
          <p className="text-xs text-muted-foreground">Clean claim history</p>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="font-semibold">Zone Risk</span>
          </div>
          <p className="text-sm font-medium">
            {worker.pincode} — {worker.zone}
          </p>
          <span className={`inline-block text-sm font-semibold ${riskColor}`}>
            {riskEmoji} {zoneLabel}
          </span>
          <p className="text-xs text-muted-foreground">Based on your delivery pincode risk index.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold">Recent payouts</h3>
          {claims.length > 0 ? (
            <div className="space-y-3">
              {claims.map((c: Claim) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-success" />
                    <span className="font-medium">₹{Number(c.payout_amount ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.status === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No payouts yet. When Nimbus detects a disruption in your zone, your first payout will appear here.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold">Quick Actions</h3>
          <div className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/policy">
                View Policy <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/claims">
                View Claims <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
