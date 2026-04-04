import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CloudRain, Thermometer, Droplets, Wind, AlertTriangle, Wifi, MapPin, CheckCircle2, Circle } from "lucide-react";
import { Claim, DisruptionEvent } from "@/types";
import { resolveWorkerId } from "@/lib/workerId";

const typeIcons: Record<string, React.ElementType> = {
  rain: CloudRain,
  heat: Thermometer,
  flood: Droplets,
  aqi: Wind,
  curfew: AlertTriangle,
  platform: Wifi,
  gps: MapPin,
};

function StatusTimeline({ status }: { status: string | null | undefined }) {
  const s = (status || "processing").toLowerCase();
  const steps = [
    { key: "processing", label: "Processing" },
    { key: "approved", label: "Approved" },
    { key: "paid", label: "Paid" },
  ];
  const idx = s === "paid" ? 2 : s === "approved" ? 1 : 0;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {steps.map((step, i) => {
        const done = i <= idx;
        const Icon = done ? CheckCircle2 : Circle;
        return (
          <div key={step.key} className="flex items-center gap-1">
            <Icon className={`h-3.5 w-3.5 ${done ? "text-success" : "text-muted-foreground"}`} />
            <span className={done ? "text-foreground" : "text-muted-foreground"}>{step.label}</span>
            {i < steps.length - 1 && <span className="mx-1 text-muted-foreground">→</span>}
          </div>
        );
      })}
    </div>
  );
}

const Claims = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [disruptions, setDisruptions] = useState<DisruptionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const workerId = await resolveWorkerId();
    if (!workerId) {
      setClaims([]);
      setDisruptions([]);
      setLoading(false);
      return;
    }

    const { data: w } = await supabase.from("workers").select("zone, pincode").eq("id", workerId).maybeSingle();
    const [claimsRes, disruptionsRes] = await Promise.all([
      supabase
        .from("claims")
        .select("*, disruptions(type, severity, event_id, reading, threshold)")
        .eq("worker_id", workerId)
        .order("created_at", { ascending: false }),
      w
        ? supabase
            .from("disruptions")
            .select("*")
            .or(`zone.eq.${w.zone},pincode.eq.${w.pincode}`)
            .eq("status", "active")
        : Promise.resolve({ data: [] }),
    ]);

    setClaims((claimsRes.data as Claim[]) || []);
    setDisruptions((disruptionsRes.data as DisruptionEvent[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const severityColor = (s: string) =>
    s === "high" ? "bg-destructive/10 text-destructive" : s === "medium" ? "bg-warning/10 text-warning" : "bg-success/10 text-success";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold">Claims & Payouts</h1>

      {disruptions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Active Disruptions in Your Zone</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {disruptions.map((d: DisruptionEvent) => {
              const Icon = d.type ? typeIcons[d.type as string] || AlertTriangle : AlertTriangle;
              return (
                <div key={d.id} className="space-y-2 rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="font-semibold capitalize">{String(d.type || "").replace("_", " ")}</span>
                    </div>
                    <Badge className={severityColor(d.severity || "low")}>{(d.severity || "").toUpperCase()}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Reading: <span className="font-medium text-foreground">{d.reading}</span> | Threshold: {d.threshold}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {claims.filter((c: Claim) => c.explainer_text).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Payout Explanations</h2>
          {claims
            .filter((c: Claim) => c.explainer_text)
            .map((c: Claim) => (
              <div key={c.id} className="space-y-3 rounded-2xl border-2 border-primary/30 bg-primary/5 p-5">
                <p className="text-sm leading-relaxed">{c.explainer_text}</p>
                <StatusTimeline status={c.status} />
                <div className="flex items-center gap-3">
                  <Badge
                    className={
                      c.status === "paid" ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"
                    }
                  >
                    {c.status === "paid" ? `₹${Number(c.payout_amount).toLocaleString()} Credited ✅` : "Processing..."}
                  </Badge>
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 font-semibold">Claims History</h2>
        {claims.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Payout</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timeline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((c: Claim) => (
                <TableRow key={c.id}>
                  <TableCell>{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{(c as Claim & { disruptions?: { event_id?: string } }).disruptions?.event_id || "—"}</TableCell>
                  <TableCell className="capitalize">
                    {(c as Claim & { disruptions?: { type?: string } }).disruptions?.type?.replace("_", " ") || "—"}
                  </TableCell>
                  <TableCell className="font-medium">₹{Number(c.payout_amount || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        c.status === "paid"
                          ? "bg-success/10 text-success"
                          : c.status === "processing" || c.status === "approved"
                            ? "bg-warning/10 text-warning"
                            : ""
                      }
                    >
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusTimeline status={c.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">
            No claims yet. When Nimbus detects a disruption in your zone, your first payout will appear here.
          </p>
        )}
      </div>
    </div>
  );
};

export default Claims;
