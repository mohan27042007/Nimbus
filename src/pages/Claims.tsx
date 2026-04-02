import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CloudRain, Thermometer, Droplets, Wind, AlertTriangle, Wifi, MapPin } from "lucide-react";
import { Claim, DisruptionEvent } from "@/types";

const typeIcons: Record<string, React.ElementType> = {
  rain: CloudRain, heat: Thermometer, flood: Droplets, aqi: Wind,
  curfew: AlertTriangle, platform: Wifi, gps: MapPin,
};

const Claims = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [disruptions, setDisruptions] = useState<DisruptionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: workers } = await supabase.from("workers").select("id, zone, pincode").order("created_at").limit(1);
    if (!workers?.length) { setLoading(false); return; }
    const w = workers[0];

    const [claimsRes, disruptionsRes] = await Promise.all([
      supabase.from("claims").select("*, disruptions(type, severity, event_id, reading, threshold)").eq("worker_id", w.id).order("created_at", { ascending: false }),
      supabase.from("disruptions").select("*").or(`zone.eq.${w.zone},pincode.eq.${w.pincode}`).eq("status", "active"),
    ]);

    setClaims((claimsRes.data as Claim[]) || []);
    setDisruptions((disruptionsRes.data as DisruptionEvent[]) || []);
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const severityColor = (s: string) =>
    s === "high" ? "bg-destructive/10 text-destructive" : s === "medium" ? "bg-warning/10 text-warning" : "bg-success/10 text-success";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Claims & Payouts</h1>

      {/* Active disruptions */}
      {disruptions.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Active Disruptions in Your Zone</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {disruptions.map((d: DisruptionEvent) => {
              const Icon = d.type ? typeIcons[d.type as string] || AlertTriangle : AlertTriangle;
              return (
                <div key={d.id} className="rounded-2xl border border-border bg-card p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="font-semibold capitalize">{d.type.replace("_", " ")}</span>
                    </div>
                    <Badge className={severityColor(d.severity)}>{d.severity?.toUpperCase()}</Badge>
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

      {/* Explainable payout cards */}
      {claims.filter((c: Claim) => c.explainer_text).length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Payout Explanations</h2>
          {claims.filter((c: Claim) => c.explainer_text).map((c: Claim) => (
            <div key={c.id} className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5">
              <p className="text-sm leading-relaxed">{c.explainer_text}</p>
              <div className="flex items-center gap-3 mt-3">
                <Badge className={c.status === "paid" ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>
                  {c.status === "paid" ? `₹${Number(c.payout_amount).toLocaleString()} Credited ✅` : "Processing..."}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Claims history table */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold mb-4">Claims History</h2>
        {claims.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Payout</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((c: Claim) => (
                <TableRow key={c.id}>
                  <TableCell>{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{c.disruptions?.event_id || "—"}</TableCell>
                  <TableCell className="capitalize">{c.disruptions?.type?.replace("_", " ") || "—"}</TableCell>
                  <TableCell className="font-medium">₹{Number(c.payout_amount || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={c.status === "paid" ? "bg-success/10 text-success" : c.status === "processing" ? "bg-warning/10 text-warning" : ""}>{c.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground py-4">No claims yet. When Nimbus detects a disruption in your zone, your first payout will appear here.</p>
        )}
      </div>
    </div>
  );
};

export default Claims;
