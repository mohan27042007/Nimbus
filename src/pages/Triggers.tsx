import { useEffect, useState } from "react";
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

const triggerTypes = [
  { id: "rain", name: "Heavy Rain", icon: CloudRain, reading: "18mm/hr", threshold: "> 20mm/hr", source: "OpenWeatherMap" },
  { id: "heat", name: "Extreme Heat", icon: Thermometer, reading: "38°C", threshold: "> 42°C", source: "OpenWeatherMap" },
  { id: "flood", name: "Flood Alert", icon: Droplets, reading: "Normal", threshold: "Alert Level", source: "IMD API" },
  { id: "aqi", name: "Severe AQI", icon: Wind, reading: "142", threshold: "> 300", source: "AQICN API" },
  { id: "curfew", name: "Curfew / Strike", icon: AlertTriangle, reading: "None", threshold: "Active", source: "NewsAPI" },
  { id: "platform", name: "Platform Order Drop", icon: Wifi, reading: "92%", threshold: "< 60%", source: "Mock API" },
  { id: "gps", name: "GPS Dead Zone", icon: MapPin, reading: "Active", threshold: "No Signal", source: "GPS Layer" },
];

const Triggers = () => {
  const [disruptions, setDisruptions] = useState<DisruptionEvent[]>([]);
  const [recentEvents, setRecentEvents] = useState<DisruptionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [simType, setSimType] = useState("rain");
  const [simZone, setSimZone] = useState("Koramangala");
  const [simPincode, setSimPincode] = useState("560034");
  const [simulating, setSimulating] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [activeRes, allRes] = await Promise.all([
      supabase.from("disruptions").select("*").eq("status", "active"),
      supabase.from("disruptions").select("*").order("triggered_at", { ascending: false }).limit(10),
    ]);
    setDisruptions((activeRes.data as DisruptionEvent[]) || []);
    setRecentEvents((allRes.data as DisruptionEvent[]) || []);
    setLoading(false);
  };

  const simulate = async () => {
    setSimulating(true);
    try {
      const triggerInfo = triggerTypes.find((t) => t.id === simType)!;
      const severity = ["high", "medium", "low"][Math.floor(Math.random() * 2)] as DisruptionSeverity; // bias toward high/medium
      const eventId = `BLR-${Date.now().toString(36).toUpperCase().slice(-6)}`;

      const { error } = await supabase.from("disruptions").insert({
        event_id: eventId,
        type: simType,
        zone: simZone,
        pincode: simPincode,
        severity,
        reading: triggerInfo.reading,
        threshold: triggerInfo.threshold,
        status: "active",
      });

      if (error) throw error;

      // Auto-create claims for affected workers
      const { data: workers } = await supabase.from("workers").select("id, earnings_baseline").or(`zone.eq.${simZone},pincode.eq.${simPincode}`);
      if (workers?.length) {
        const { data: newDisruption } = await supabase.from("disruptions").select("id").eq("event_id", eventId).single();
        for (const w of workers) {
          const pct = severity === "high" ? 60 : severity === "medium" ? 40 : 20;
          const payout = Math.round(Number(w.earnings_baseline) * pct / 100);
          await supabase.from("claims").insert({
            worker_id: w.id,
            disruption_id: newDisruption?.id,
            payout_amount: payout,
            baseline_earnings: w.earnings_baseline,
            protection_percentage: pct,
            explainer_text: `Event #${eventId}: ${triggerInfo.name} (${triggerInfo.reading}) detected in ${simZone}. Your baseline: ₹${Number(w.earnings_baseline).toLocaleString()}. Protected at ${pct}% = ₹${payout} credited.`,
            status: "paid",
            approved_at: new Date().toISOString(),
          });
          await supabase.from("payouts").insert({
            claim_id: (await supabase.from("claims").select("id").order("created_at", { ascending: false }).limit(1)).data?.[0]?.id || "",
            worker_id: w.id,
            amount: payout,
            upi_id: "worker@upi",
            status: "paid",
          });
        }
      }

      toast.success(`Disruption triggered! ${workers?.length || 0} workers affected — claims processing...`);
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to simulate");
    } finally {
      setSimulating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const activeIds = new Set(disruptions.map((d: DisruptionEvent) => d.type));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Disruption Trigger Monitor</h1>
        <Button onClick={() => setModalOpen(true)} variant="destructive" className="gap-2">
          <AlertCircle className="h-4 w-4" /> 🔴 Simulate Disruption
        </Button>
      </div>

      {/* Trigger cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {triggerTypes.map((t) => {
          const isActive = activeIds.has(t.id);
          const activeDisruption = disruptions.find((d: DisruptionEvent) => d.type === t.id);
          const status = isActive ? "TRIGGERED" : "NORMAL";
          const statusColor = isActive ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success";

          return (
            <div key={t.id} className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <t.icon className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-sm">{t.name}</span>
                </div>
                <Badge className={statusColor}>{status}</Badge>
              </div>
              <div className="text-sm space-y-1">
                <p>Reading: <span className="font-medium">{activeDisruption?.reading || t.reading}</span></p>
                <p>Threshold: <span className="text-muted-foreground">{t.threshold}</span></p>
              </div>
              <p className="text-xs text-muted-foreground">Source: {t.source}</p>
            </div>
          );
        })}
      </div>

      {/* Recent events */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold mb-4">Recent Trigger Events</h2>
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
                    <Badge className={e.severity === "high" ? "bg-destructive/10 text-destructive" : e.severity === "medium" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}>
                      {e.severity?.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell><Badge variant={e.status === "active" ? "default" : "secondary"}>{e.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground py-4">All signals normal. Monitoring 7 data sources every 15 minutes.</p>
        )}
      </div>

      {/* Simulate modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Simulate Disruption</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Disruption Type</Label>
              <Select value={simType} onValueChange={setSimType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {triggerTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
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
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
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
