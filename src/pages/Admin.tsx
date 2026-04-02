import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Users, IndianRupee, TrendingUp, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AdminChartPoint, Claim, DisruptionEvent, Payout, Policy, Worker } from "@/types";

const Admin = () => {
  const [stats, setStats] = useState({ workers: 0, premiums: 0, payouts: 0, lossRatio: 0 });
  const [weeklyData, setWeeklyData] = useState<AdminChartPoint[]>([]);
  const [claimsByType, setClaimsByType] = useState<{ type: string; count: number }[]>([]);
  const [disruptions, setDisruptions] = useState<DisruptionEvent[]>([]);
  const [flaggedClaims, setFlaggedClaims] = useState<Claim[]>([]);
  const [topWorkers, setTopWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [workersRes, policiesRes, payoutsRes, disruptionsRes, claimsRes, topRes] = await Promise.all([
      supabase.from("workers").select("id, name, trust_score"),
      supabase.from("policies").select("weekly_premium").eq("status", "active"),
      supabase.from("payouts").select("amount, created_at"),
      supabase.from("disruptions").select("*").eq("status", "active"),
      supabase.from("claims").select("*, workers(name), disruptions(type, severity)").order("created_at", { ascending: false }),
      supabase.from("workers").select("name, trust_score, zone").order("trust_score", { ascending: false }).limit(10),
    ]);

    const workers = (workersRes.data as Worker[]) || [];
    const policies = (policiesRes.data as Policy[]) || [];
    const allPayouts = (payoutsRes.data as Payout[]) || [];
    const allClaims = (claimsRes.data as Claim[]) || [];

    const totalPremiums = policies.reduce((s: number, p: Policy) => s + Number(p.weekly_premium), 0);
    const totalPayouts = allPayouts.reduce((s: number, p: Payout) => s + Number(p.amount), 0);
    const lossRatio = totalPremiums > 0 ? Math.round((totalPayouts / totalPremiums) * 100) : 0;

    setStats({ workers: workers.length, premiums: totalPremiums, payouts: totalPayouts, lossRatio });
    setDisruptions((disruptionsRes.data as DisruptionEvent[]) || []);
    setFlaggedClaims(allClaims.filter((c: Claim) => c.fraud_flag));
    setTopWorkers((topRes.data as Worker[]) || []);

    // Mock weekly data for charts
    const weeks = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"];
    setWeeklyData(weeks.map((w, i) => ({
      week: w,
      premiums: totalPremiums * (0.7 + Math.random() * 0.6),
      payouts: totalPayouts * (0.3 + Math.random() * 0.7),
    })));

    // Claims by type
    const typeMap: Record<string, number> = {};
    allClaims.forEach((c: Claim) => {
      const t = c.disruptions?.type || "unknown";
      typeMap[t] = (typeMap[t] || 0) + 1;
    });
    setClaimsByType(Object.entries(typeMap).map(([type, count]) => ({ type, count })));

    setLoading(false);
  };

  const handleFraud = async (claimId: string, action: "approve" | "reject") => {
    const newStatus = action === "approve" ? "paid" : "rejected";
    await supabase.from("claims").update({ status: newStatus, fraud_flag: false }).eq("id", claimId);
    toast.success(`Claim ${action}d`);
    load();
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const lossColor = stats.lossRatio > 70 ? "text-destructive" : stats.lossRatio < 50 ? "text-success" : "text-warning";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Active Workers", value: stats.workers, color: "text-primary" },
          { icon: IndianRupee, label: "Premiums This Week", value: `₹${stats.premiums.toLocaleString()}`, color: "text-success" },
          { icon: IndianRupee, label: "Payouts This Week", value: `₹${stats.payouts.toLocaleString()}`, color: "text-warning" },
          { icon: TrendingUp, label: "Loss Ratio", value: `${stats.lossRatio}%`, color: lossColor },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <span className="text-sm text-muted-foreground">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Premiums vs Payouts (6 Weeks)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Line type="monotone" dataKey="premiums" stroke="hsl(var(--success))" strokeWidth={2} name="Premiums" />
              <Line type="monotone" dataKey="payouts" stroke="hsl(var(--warning))" strokeWidth={2} name="Payouts" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Claims by Disruption Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={claimsByType}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="type" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Claims" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active disruptions */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">Active Disruptions</h3>
        {disruptions.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {disruptions.map((d: DisruptionEvent) => (
              <div key={d.id} className="flex items-center justify-between border border-border rounded-xl p-3">
                <div>
                  <span className="font-medium capitalize">{d.type?.replace("_", " ")}</span>
                  <span className="text-muted-foreground text-sm ml-2">{d.zone}</span>
                </div>
                <Badge className={d.severity === "high" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}>
                  {d.severity?.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No active disruptions</p>
        )}
      </div>

      {/* Fraud queue */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" /> Fraud Alerts
        </h3>
        {flaggedClaims.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Worker</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {flaggedClaims.map((c: Claim) => (
                <TableRow key={c.id}>
                  <TableCell>{c.workers?.name || "—"}</TableCell>
                  <TableCell>₹{Number(c.payout_amount).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="destructive">Flagged</Badge></TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" onClick={() => handleFraud(c.id, "approve")} className="gap-1"><CheckCircle className="h-3 w-3" />Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleFraud(c.id, "reject")} className="gap-1"><XCircle className="h-3 w-3" />Reject</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">No flagged claims</p>
        )}
      </div>

      {/* Leaderboard */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">Trust Score Leaderboard</h3>
        {topWorkers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow><TableHead>#</TableHead><TableHead>Worker</TableHead><TableHead>Zone</TableHead><TableHead>Trust Score</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {topWorkers.map((w: Worker, i: number) => (
                <TableRow key={w.name + i}>
                  <TableCell className="font-medium">{i + 1}</TableCell>
                  <TableCell>{w.name}</TableCell>
                  <TableCell>{w.zone}</TableCell>
                  <TableCell>
                    <span className="font-semibold text-primary">{w.trust_score}</span>/100
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">No workers yet</p>
        )}
      </div>
    </div>
  );
};

export default Admin;
