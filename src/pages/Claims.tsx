import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
  AlertTriangle,
  Wifi,
  MapPin,
  CheckCircle2,
  Circle,
  IndianRupee,
} from "lucide-react";
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
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      {steps.map((step, i) => {
        const done = i <= idx;
        const Icon = done ? CheckCircle2 : Circle;
        return (
          <div key={step.key} className="flex items-center gap-1">
            <Icon
              className={`h-3.5 w-3.5 ${
                done ? "text-emerald-400" : "text-muted-foreground"
              }`}
            />
            <span
              className={done ? "text-foreground font-medium" : "text-muted-foreground"}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <span className="mx-0.5 text-muted-foreground">→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string | null | undefined }) {
  const s = (severity || "low").toLowerCase();
  const map: Record<string, string> = {
    low: "badge-low",
    medium: "badge-medium",
    high: "badge-high",
    critical: "badge-critical",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
        map[s] ?? "badge-low"
      }`}
    >
      {s}
    </span>
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

    const { data: w } = await supabase
      .from("workers")
      .select("zone, pincode")
      .eq("id", workerId)
      .maybeSingle();
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

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Claims & Payouts</h1>
        <p className="text-sm text-muted-foreground">
          Your payout history and active disruption status.
        </p>
      </div>

      {/* Active disruptions in zone */}
      {disruptions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold uppercase tracking-wider text-muted-foreground">
            Active Disruptions in Your Zone
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {disruptions.map((d: DisruptionEvent) => {
              const Icon = d.type
                ? typeIcons[d.type as string] || AlertTriangle
                : AlertTriangle;
              return (
                <div
                  key={d.id}
                  className="glass-card rounded-2xl p-5 space-y-3 border-red-500/20 shadow-[0_0_16px_rgba(239,68,68,0.06)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-red-400" />
                      <span className="font-semibold capitalize">
                        {String(d.type || "").replace("_", " ")}
                      </span>
                    </div>
                    <SeverityBadge severity={d.severity} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Reading:{" "}
                    <span className="font-semibold text-foreground">
                      {d.reading}
                    </span>{" "}
                    &middot; Threshold: {d.threshold}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payout explanations — hero cards */}
      {claims.filter((c: Claim) => c.explainer_text).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold uppercase tracking-wider text-muted-foreground">
            Payout Explanations
          </h2>
          {claims
            .filter((c: Claim) => c.explainer_text)
            .map((c: Claim) => (
              <div
                key={c.id}
                className="rounded-2xl border border-primary/25 bg-primary/5 p-5 space-y-3"
              >
                <p className="text-sm leading-relaxed text-foreground/90">
                  {c.explainer_text}
                </p>
                <StatusTimeline status={c.status} />
                <div className="flex items-center gap-3 pt-1">
                  {c.status === "paid" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold badge-normal">
                      <IndianRupee className="h-3.5 w-3.5" />
                      {Number(c.payout_amount).toLocaleString()} Credited
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold badge-medium">
                      Processing...
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Claims history table */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="mb-4 font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Claims History
        </h2>
        {claims.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06]">
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
                <TableRow key={c.id} className="border-white/[0.04]">
                  <TableCell className="text-xs text-muted-foreground">
                    {c.created_at
                      ? new Date(c.created_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {(
                      c as Claim & { disruptions?: { event_id?: string } }
                    ).disruptions?.event_id || "—"}
                  </TableCell>
                  <TableCell className="capitalize font-medium">
                    {(
                      c as Claim & { disruptions?: { type?: string } }
                    ).disruptions?.type?.replace("_", " ") || "—"}
                  </TableCell>
                  <TableCell className="font-bold text-emerald-400">
                    ₹{Number(c.payout_amount || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        c.status === "paid"
                          ? "badge-normal border-0"
                          : c.status === "processing" ||
                            c.status === "approved"
                          ? "badge-medium border-0"
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
          <p className="py-6 text-sm text-muted-foreground text-center">
            No claims yet. When Nimbus detects a disruption in your zone, your
            first payout will appear here.
          </p>
        )}
      </div>
    </div>
  );
};

export default Claims;
