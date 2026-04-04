import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CloudRain, Thermometer, Droplets, Wind, AlertTriangle, Wifi, MapPin, AlertCircle } from "lucide-react";
import { DisruptionEvent, DisruptionSeverity } from "@/types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const triggerTypes = [
  { id: "rain", name: "Heavy Rain", icon: CloudRain, reading: "18mm/hr", threshold: "> 20mm/hr", source: "OpenWeatherMap" },
  { id: "heat", name: "Extreme Heat", icon: Thermometer, reading: "38°C", threshold: "> 42°C", source: "OpenWeatherMap" },
  { id: "flood", name: "Flood Alert", icon: Droplets, reading: "Normal", threshold: "Alert Level", source: "IMD API" },
  { id: "aqi", name: "Severe AQI", icon: Wind, reading: "142", threshold: "> 300", source: "AQICN API" },
  { id: "curfew", name: "Curfew / Strike", icon: AlertTriangle, reading: "None", threshold: "Active", source: "NewsAPI" },
  { id: "platform", name: "Platform Order Drop", icon: Wifi, reading: "92%", threshold: "< 60%", source: "Mock API" },
  { id: "gps", name: "GPS Dead Zone", icon: MapPin, reading: "Active", threshold: "No Signal", source: "GPS Layer" },
];

/** DB + payout math (prompt). */
const TYPE_DB: Record<string, { reading: string; threshold: string }> = {
  rain: { reading: "28mm/hr", threshold: ">20mm/hr" },
  heat: { reading: "43°C", threshold: ">42°C" },
  flood: { reading: "Red Alert Active", threshold: "Red Alert issued" },
  aqi: { reading: "AQI 315", threshold: "AQI >300" },
  curfew: { reading: "Section 144 Active", threshold: "Confirmed event" },
  platform: { reading: "75% order drop", threshold: ">70% drop" },
  gps: { reading: "Dead zone 90min", threshold: ">90min no orders" },
};

const BASE_PAYOUT: Record<string, number> = {
  rain: 300,
  heat: 200,
  flood: 400,
  aqi: 200,
  curfew: 350,
  platform: 250,
  gps: 200,
};

function baseForType(t: string): number {
  return BASE_PAYOUT[t] ?? 200;
}

const Triggers = () => {
  const [disruptions, setDisruptions] = useState<DisruptionEvent[]>([]);
  const [recentEvents, setRecentEvents] = useState<DisruptionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [simType, setSimType] = useState("rain");
  const [simZone, setSimZone] = useState("Koramangala");
  const [simPincode, setSimPincode] = useState("560034");
  const [simulating, setSimulating] = useState(false);

  const load = useCallback(async () => {
    const [activeRes, allRes] = await Promise.all([
      supabase.from("disruptions").select("*").eq("status", "active"),
      supabase.from("disruptions").select("*").order("triggered_at", { ascending: false }).limit(10),
    ]);
    setDisruptions((activeRes.data as DisruptionEvent[]) || []);
    setRecentEvents((allRes.data as DisruptionEvent[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const simulate = async () => {
    setSimulating(true);
    const meta = TYPE_DB[simType] || TYPE_DB.rain!;
    const eventId = `BLR-${Date.now().toString().slice(-6)}`;

    try {
      const { data: existingRows } = await supabase
        .from("disruptions")
        .select("type")
        .eq("zone", simZone)
        .eq("pincode", simPincode)
        .eq("status", "active");

      const existing = (existingRows || []) as { type: string }[];
      const stackBonus = existing.reduce((sum, row) => sum + 0.7 * baseForType(row.type), 0);
      const primaryBase = baseForType(simType);
      const payoutAmount = Math.round(primaryBase + stackBonus);

      const { data: inserted, error: insErr } = await supabase
        .from("disruptions")
        .insert({
          event_id: eventId,
          type: simType,
          zone: simZone,
          pincode: simPincode,
          severity: "high" as DisruptionSeverity,
          reading: meta.reading,
          threshold: meta.threshold,
          status: "active",
          triggered_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insErr) throw insErr;
      const disruptionId = inserted!.id;

      const { data: workers, error: wErr } = await supabase
        .from("workers")
        .select("id, earnings_baseline, upi_id, trust_score")
        .eq("pincode", simPincode);

      if (wErr) throw wErr;

      const eligible: {
        id: string;
        earnings_baseline: number | null;
        upi_id: string | null;
        trust_score: number | null;
        max_payout: number;
      }[] = [];

      for (const w of workers || []) {
        const { data: pol } = await supabase
          .from("policies")
          .select("max_payout")
          .eq("worker_id", w.id)
          .eq("status", "active")
          .maybeSingle();
        if (pol) {
          eligible.push({ ...w, max_payout: Number(pol.max_payout) });
        }
      }

      if (eligible.length === 0) {
        toast.info("Disruption recorded. No workers with active policies matched this pincode.");
        setModalOpen(false);
        await load();
        return;
      }

      const sampleCap = Math.min(payoutAmount, eligible[0]!.max_payout);
      toast.success(
        `Disruption triggered in ${simZone}. Processing ₹${sampleCap} payout for ${eligible.length} worker${eligible.length === 1 ? "" : "s"}...`
      );

      for (const w of eligible) {
        const capped = Math.min(payoutAmount, w.max_payout);
        const baseline = Number(w.earnings_baseline ?? 1000);
        const protectionPct = Math.round((capped / baseline) * 100);
        const explainer = `Event #${eventId}: ${simType} (${meta.reading}) detected in ${simZone}. Your baseline: ₹${baseline}. Protected at ${protectionPct}% = ₹${capped} credited.`;

        const { data: claimRow, error: cErr } = await supabase
          .from("claims")
          .insert({
            worker_id: w.id,
            disruption_id: disruptionId,
            payout_amount: capped,
            baseline_earnings: baseline,
            protection_percentage: protectionPct,
            explainer_text: explainer,
            status: "processing",
            fraud_flag: false,
          })
          .select("id")
          .single();

        if (cErr || !claimRow) {
          console.error(cErr);
          continue;
        }

        await sleep(2000);
        await supabase
          .from("claims")
          .update({ status: "approved", approved_at: new Date().toISOString() })
          .eq("id", claimRow.id);

        await sleep(1000);
        await supabase.from("payouts").insert({
          claim_id: claimRow.id,
          worker_id: w.id,
          amount: capped,
          upi_id: w.upi_id || "",
          status: "completed",
        });
        await supabase.from("claims").update({ status: "paid" }).eq("id", claimRow.id);
        await supabase
          .from("workers")
          .update({ trust_score: (w.trust_score ?? 0) + 1 })
          .eq("id", w.id);

        toast.success(`₹${capped} credited to ${w.upi_id || "UPI"}`);
      }

      setModalOpen(false);
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to simulate");
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeIds = new Set(disruptions.map((d: DisruptionEvent) => d.type));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Disruption Trigger Monitor</h1>
        <Button onClick={() => setModalOpen(true)} variant="destructive" className="gap-2">
          <AlertCircle className="h-4 w-4" /> 🔴 Simulate Disruption
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {triggerTypes.map((t) => {
          const isActive = activeIds.has(t.id);
          const activeDisruption = disruptions.find((d: DisruptionEvent) => d.type === t.id);
          const status = isActive ? "TRIGGERED" : "NORMAL";
          const statusColor = isActive ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success";

          return (
            <div key={t.id} className="space-y-3 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <t.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold">{t.name}</span>
                </div>
                <Badge className={statusColor}>{status}</Badge>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  Reading: <span className="font-medium">{activeDisruption?.reading || t.reading}</span>
                </p>
                <p>
                  Threshold: <span className="text-muted-foreground">{t.threshold}</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Source: {t.source}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 font-semibold">Recent Trigger Events</h2>
        {recentEvents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Event ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEvents.map((e: DisruptionEvent) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs">{e.triggered_at ? new Date(e.triggered_at).toLocaleString() : "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{e.event_id}</TableCell>
                  <TableCell className="capitalize">{e.type?.replace("_", " ")}</TableCell>
                  <TableCell>{e.zone}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        e.severity === "high"
                          ? "bg-destructive/10 text-destructive"
                          : e.severity === "medium"
                            ? "bg-warning/10 text-warning"
                            : "bg-success/10 text-success"
                      }
                    >
                      {e.severity?.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={e.status === "active" ? "default" : "secondary"}>{e.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">All signals normal. Monitoring 7 data sources every 15 minutes.</p>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Simulate Disruption</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Disruption Type</Label>
              <Select value={simType} onValueChange={setSimType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {triggerTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Zone</Label>
              <Input value={simZone} onChange={(e) => setSimZone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Pincode</Label>
              <Input value={simPincode} onChange={(e) => setSimPincode(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={simulate} disabled={simulating}>
              {simulating ? "Triggering..." : "Trigger Disruption"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Triggers;
