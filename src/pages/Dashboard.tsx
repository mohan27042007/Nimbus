import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Shield,
  ShieldCheck,
  MapPin,
  ArrowRight,
  IndianRupee,
  Loader2,
  AlertTriangle,
  Star,
} from "lucide-react";

import { Claim, Policy, Worker } from "@/types";
import { resolveWorkerId } from "@/lib/workerId";
import { getZoneRiskScore, riskLevelLabel } from "@/lib/pincodeRisk";

interface WorkerData {
  worker: Worker;
  policy: Policy | null;
  claims: Claim[];
}

/** SVG radial trust ring ─────────────────────────────────────── */
function TrustRing({ score }: { score: number | null }) {
  const safeScore = score ?? 0;
  const radius = 38;
  const stroke = 7;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const offset = circumference - (safeScore / 100) * circumference;

  const color =
    safeScore >= 80
      ? "#48BB78"
      : safeScore >= 50
      ? "#ED8936"
      : "#FC8181";

  return (
    <svg
      width={radius * 2}
      height={radius * 2}
      viewBox={`0 0 ${radius * 2} ${radius * 2}`}
      role="img"
      aria-label={`Trust score: ${safeScore} out of 100`}
    >
      {/* Track */}
      <circle
        cx={radius}
        cy={radius}
        r={normalizedRadius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={stroke}
      />
      {/* Progress arc */}
      <circle
        cx={radius}
        cy={radius}
        r={normalizedRadius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${radius} ${radius})`}
        className="trust-ring-arc"
        style={
          {
            "--ring-circumference": circumference,
            "--ring-offset": offset,
          } as React.CSSProperties
        }
      />
      {/* Center text */}
      <text
        x={radius}
        y={radius + 6}
        textAnchor="middle"
        fill="white"
        fontSize="15"
        fontWeight="700"
        fontFamily="Inter, sans-serif"
      >
        {safeScore}
      </text>
    </svg>
  );
}

/** Zone risk badge ───────────────────────────────────────────── */
function ZoneBadge({ label }: { label: string }) {
  const map: Record<string, string> = {
    HIGH: "badge-high",
    MEDIUM: "badge-medium",
    LOW: "badge-normal",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${map[label] ?? "badge-normal"}`}
    >
      {label === "HIGH" && <AlertTriangle className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
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

      const { data: workerRow, error: wErr } = await supabase
        .from("workers")
        .select("*")
        .eq("id", workerId)
        .maybeSingle();
      if (wErr || !workerRow) {
        setData(null);
        return;
      }
      const worker = workerRow as Worker;

      const [policiesRes, claimsRes] = await Promise.all([
        supabase
          .from("policies")
          .select("*")
          .eq("worker_id", worker.id)
          .eq("status", "active")
          .limit(1),
        supabase
          .from("claims")
          .select("*")
          .eq("worker_id", worker.id)
          .order("created_at", { ascending: false })
          .limit(3),
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
        <p className="text-muted-foreground">
          Get started by creating your profile.
        </p>
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

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back,{" "}
          <span className="text-primary">{worker.name || "Worker"}</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          {worker.zone} — {worker.pincode}, {worker.city}
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Coverage card */}
        <div className="glass-card card-enter rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Coverage
            </span>
          </div>
          {policy ? (
            <div className="space-y-2">
              <p className="text-lg font-bold text-emerald-400">Active</p>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Plan</span>
                  <span className="font-medium text-foreground capitalize">
                    {policy.tier}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Weekly Premium</span>
                  <span className="font-semibold text-primary">
                    ₹{policy.weekly_premium}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Max Payout</span>
                  <span className="font-medium text-foreground">
                    ₹{Number(policy.max_payout).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Renewal</span>
                  <span className="font-medium text-foreground">
                    {policy.renewal_date}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active policy</p>
          )}
        </div>

        {/* Trust Score card */}
        <div className="glass-card card-enter card-enter-delay-1 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Trust Score
            </span>
          </div>
          <div className="flex items-center gap-4">
            <TrustRing score={worker.trust_score} />
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {worker.trust_score}
                <span className="text-sm text-muted-foreground font-normal">
                  /100
                </span>
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Clean claim history
              </p>
            </div>
          </div>
        </div>

        {/* Zone Risk card */}
        <div className="glass-card card-enter card-enter-delay-2 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Zone Risk
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {worker.pincode} — {worker.zone}
            </p>
            <ZoneBadge label={zoneLabel} />
            <p className="text-xs text-muted-foreground">
              Based on your delivery pincode risk index.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Payouts */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="mb-4 font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            Recent Payouts
          </h3>
          {claims.length > 0 ? (
            <div className="space-y-3">
              {claims.map((c: Claim) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between text-sm py-2 border-b border-white/[0.05] last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-emerald-400" />
                    <span className="font-semibold text-emerald-400">
                      ₹{Number(c.payout_amount ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs">
                      {c.created_at
                        ? new Date(c.created_at).toLocaleDateString()
                        : "—"}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                        c.status === "paid"
                          ? "badge-normal"
                          : "badge-medium"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">
              No payouts yet. When Nimbus detects a disruption in your zone,
              your first payout will appear here.
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="mb-4 font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Button
              asChild
              variant="outline"
              className="w-full justify-between border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all"
            >
              <Link to="/policy">
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  View Policy
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-between border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all"
            >
              <Link to="/claims">
                <span className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-primary" />
                  View Claims
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
