import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Shield, ArrowUp, ArrowDown, CheckCircle } from "lucide-react";
import { Policy as PolicyModel, Worker } from "@/types";
import { resolveWorkerId } from "@/lib/workerId";
import { getZoneRiskScore } from "@/lib/pincodeRisk";
import { calculatePremium, TIER_MAX_PAYOUT, type PremiumTier } from "@/utils/premium";

const tierDetails = [
  { id: "basic" as const, name: "Basic", premium: 99, maxPayout: 500, desc: "Part-time workers", features: ["Rain protection", "Basic coverage"] },
  { id: "standard" as const, name: "Standard", premium: 179, maxPayout: 1000, desc: "Full-time workers", features: ["Rain + heat protection", "Flood alerts", "Priority payouts"] },
  { id: "premium" as const, name: "Premium", premium: 299, maxPayout: 2000, desc: "High earners", features: ["All disruption types", "Maximum coverage", "Lowest premiums via trust", "Priority support"] },
];

const Policy = () => {
  const [policy, setPolicy] = useState<PolicyModel | null>(null);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [allPolicies, setAllPolicies] = useState<PolicyModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const workerId = await resolveWorkerId();
    if (!workerId) {
      setLoading(false);
      return;
    }
    const { data: w } = await supabase.from("workers").select("*").eq("id", workerId).maybeSingle();
    if (!w) {
      setLoading(false);
      return;
    }
    setWorker(w as Worker);
    const { data: policies } = await supabase
      .from("policies")
      .select("*")
      .eq("worker_id", w.id)
      .order("created_at", { ascending: false });
    const typedPolicies = (policies as PolicyModel[]) || [];
    setAllPolicies(typedPolicies);
    setPolicy(typedPolicies.find((p: PolicyModel) => p.status === "active") || typedPolicies[0] || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeTier = async (newTier: PremiumTier) => {
    if (!worker || !policy) return;
    setBusy(true);
    try {
      const zoneRisk = getZoneRiskScore(worker.pincode);
      const trust = worker.trust_score ?? 100;
      const month = new Date().getMonth() + 1;
      const { premium } = calculatePremium(zoneRisk, worker.earnings_baseline ?? 1000, trust, newTier, 15, 100, month);

      const { error } = await supabase
        .from("policies")
        .update({
          tier: newTier,
          weekly_premium: premium,
          max_payout: TIER_MAX_PAYOUT[newTier],
        })
        .eq("id", policy.id);

      if (error) throw error;
      toast.success(`Plan updated to ${newTier}`);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update plan");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!policy) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-center">
        <p className="text-muted-foreground">No policy found. Please onboard first.</p>
      </div>
    );
  }

  const currentTier = tierDetails.find((t) => t.id === policy.tier)!;
  const tierIdx = tierDetails.findIndex((t) => t.id === policy.tier);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold">Policy Management</h1>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <Badge className="capitalize">{policy.tier}</Badge>
          <Badge
            variant={policy.status === "active" ? "default" : "secondary"}
            className={policy.status === "active" ? "bg-success text-success-foreground" : ""}
          >
            {policy.status === "active" ? "Active ✅" : policy.status}
          </Badge>
        </div>
        <div className="grid gap-4 text-sm sm:grid-cols-2 md:grid-cols-4">
          <div>
            <span className="text-muted-foreground">Weekly Premium</span>
            <p className="text-lg font-semibold text-primary">₹{policy.weekly_premium}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Max Payout</span>
            <p className="text-lg font-semibold">₹{Number(policy.max_payout).toLocaleString()}/week</p>
          </div>
          <div>
            <span className="text-muted-foreground">Start Date</span>
            <p className="font-medium">{policy.start_date}</p>
          </div>
          <div>
            <span className="text-muted-foreground">End Date</span>
            <p className="font-medium">{policy.end_date || "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Renewal Date</span>
            <p className="font-medium">{policy.renewal_date}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {tierIdx < tierDetails.length - 1 && (
            <Button disabled={busy} onClick={() => changeTier(tierDetails[tierIdx + 1].id)} className="gap-2">
              <ArrowUp className="h-4 w-4" /> Upgrade to {tierDetails[tierIdx + 1].name}
            </Button>
          )}
          {tierIdx > 0 && (
            <Button
              disabled={busy}
              variant="outline"
              onClick={() => changeTier(tierDetails[tierIdx - 1].id)}
              className="gap-2"
            >
              <ArrowDown className="h-4 w-4" /> Downgrade to {tierDetails[tierIdx - 1].name}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 font-semibold">Plan Comparison</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {tierDetails.map((t) => (
            <div
              key={t.id}
              className={`rounded-xl border-2 p-5 ${t.id === policy.tier ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <h3 className="text-lg font-semibold">{t.name}</h3>
              <p className="text-2xl font-bold text-primary">
                ₹{t.premium}
                <span className="text-sm font-normal text-muted-foreground">/week</span>
              </p>
              <p className="mb-3 text-sm text-muted-foreground">Up to ₹{t.maxPayout.toLocaleString()}/week</p>
              <ul className="space-y-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              {t.id === policy.tier && <Badge className="mt-3 bg-primary text-primary-foreground">Current Plan</Badge>}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 font-semibold">Policy History</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Premium</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allPolicies.map((p: PolicyModel) => (
              <TableRow key={p.id}>
                <TableCell>
                  {p.start_date} — {p.end_date || "Ongoing"}
                </TableCell>
                <TableCell className="capitalize">{p.tier}</TableCell>
                <TableCell>₹{p.weekly_premium}/week</TableCell>
                <TableCell>
                  <Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Policy;
