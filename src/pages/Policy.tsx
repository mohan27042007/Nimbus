import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Shield, ArrowUp, ArrowDown, CheckCircle } from "lucide-react";
import { Policy as PolicyModel, Worker } from "@/types";

const tierDetails = [
  { id: "basic", name: "Basic", premium: 99, maxPayout: 500, desc: "Part-time workers", features: ["Rain protection", "Basic coverage"] },
  { id: "standard", name: "Standard", premium: 179, maxPayout: 1000, desc: "Full-time workers", features: ["Rain + heat protection", "Flood alerts", "Priority payouts"] },
  { id: "premium", name: "Premium", premium: 299, maxPayout: 2000, desc: "High earners", features: ["All disruption types", "Maximum coverage", "Lowest premiums via trust", "Priority support"] },
];

const Policy = () => {
  const [policy, setPolicy] = useState<PolicyModel | null>(null);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [allPolicies, setAllPolicies] = useState<PolicyModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: workers } = await supabase.from("workers").select("*").order("created_at").limit(1);
    if (!workers?.length) { setLoading(false); return; }
    setWorker((workers[0] as Worker) || null);
    const { data: policies } = await supabase.from("policies").select("*").eq("worker_id", workers[0].id).order("created_at", { ascending: false });
    const typedPolicies = (policies as PolicyModel[]) || [];
    setAllPolicies(typedPolicies);
    setPolicy(typedPolicies.find((p: PolicyModel) => p.status === "active") || typedPolicies[0] || null);
    setLoading(false);
  };

  const changeTier = async (newTier: string) => {
    if (!worker || !policy) return;
    const tier = tierDetails.find((t) => t.id === newTier)!;
    const { error } = await supabase.from("policies").update({ status: "inactive" }).eq("id", policy.id);
    if (error) { toast.error("Failed to update"); return; }
    const { error: e2 } = await supabase.from("policies").insert({
      worker_id: worker.id, tier: newTier, weekly_premium: tier.premium, max_payout: tier.maxPayout,
      status: "active", start_date: new Date().toISOString().split("T")[0],
      end_date: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
      renewal_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    });
    if (e2) { toast.error("Failed to create new policy"); return; }
    toast.success(`Switched to ${tier.name} plan! 🎉`);
    load();
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!policy) return <div className="mx-auto max-w-6xl px-4 py-12 text-center"><p className="text-muted-foreground">No policy found. Please onboard first.</p></div>;

  const currentTier = tierDetails.find((t) => t.id === policy.tier)!;
  const tierIdx = tierDetails.findIndex((t) => t.id === policy.tier);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Policy Management</h1>

      {/* Current policy */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <Badge className="capitalize">{policy.tier}</Badge>
          <Badge variant={policy.status === "active" ? "default" : "secondary"} className={policy.status === "active" ? "bg-success text-success-foreground" : ""}>
            {policy.status === "active" ? "Active ✅" : policy.status}
          </Badge>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-muted-foreground">Weekly Premium</span><p className="font-semibold text-primary text-lg">₹{policy.weekly_premium}</p></div>
          <div><span className="text-muted-foreground">Max Payout</span><p className="font-semibold text-lg">₹{Number(policy.max_payout).toLocaleString()}/week</p></div>
          <div><span className="text-muted-foreground">Start Date</span><p className="font-medium">{policy.start_date}</p></div>
          <div><span className="text-muted-foreground">Renewal Date</span><p className="font-medium">{policy.renewal_date}</p></div>
        </div>
        <div className="flex gap-3">
          {tierIdx < tierDetails.length - 1 && (
            <Button onClick={() => changeTier(tierDetails[tierIdx + 1].id)} className="gap-2">
              <ArrowUp className="h-4 w-4" /> Upgrade to {tierDetails[tierIdx + 1].name}
            </Button>
          )}
          {tierIdx > 0 && (
            <Button variant="outline" onClick={() => changeTier(tierDetails[tierIdx - 1].id)} className="gap-2">
              <ArrowDown className="h-4 w-4" /> Downgrade to {tierDetails[tierIdx - 1].name}
            </Button>
          )}
        </div>
      </div>

      {/* Tier comparison */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold mb-4">Plan Comparison</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {tierDetails.map((t) => (
            <div key={t.id} className={`rounded-xl border-2 p-5 ${t.id === policy.tier ? "border-primary bg-primary/5" : "border-border"}`}>
              <h3 className="font-semibold text-lg">{t.name}</h3>
              <p className="text-2xl font-bold text-primary">₹{t.premium}<span className="text-sm text-muted-foreground font-normal">/week</span></p>
              <p className="text-sm text-muted-foreground mb-3">Up to ₹{t.maxPayout.toLocaleString()}/week</p>
              <ul className="space-y-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="h-3.5 w-3.5 text-success" />{f}</li>
                ))}
              </ul>
              {t.id === policy.tier && <Badge className="mt-3 bg-primary text-primary-foreground">Current Plan</Badge>}
            </div>
          ))}
        </div>
      </div>

      {/* Policy history */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold mb-4">Policy History</h2>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Period</TableHead><TableHead>Tier</TableHead><TableHead>Premium</TableHead><TableHead>Status</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {allPolicies.map((p: PolicyModel) => (
              <TableRow key={p.id}>
                <TableCell>{p.start_date} — {p.end_date || "Ongoing"}</TableCell>
                <TableCell className="capitalize">{p.tier}</TableCell>
                <TableCell>₹{p.weekly_premium}/week</TableCell>
                <TableCell><Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Policy;
