import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  User,
  MapPin,
  Shield,
  ShieldCheck,
  IndianRupee,
  Loader2,
} from "lucide-react";
import {
  calculatePremium,
  TIER_MAX_PAYOUT,
  type PremiumTier,
} from "@/utils/premium";
import { getZoneRiskScore, riskLevelLabel } from "@/lib/pincodeRisk";
import { setStoredWorkerId } from "@/lib/workerId";
import { fetchMLPremium } from "@/hooks/useMLApi";

const cities = ["Bangalore", "Mumbai", "Delhi", "Chennai", "Hyderabad"];

const tiers = [
  {
    id: "basic" as const,
    name: "Basic",
    premium: 99,
    maxPayout: 500,
    desc: "Part-time workers",
    recommended: false,
  },
  {
    id: "standard" as const,
    name: "Standard",
    premium: 179,
    maxPayout: 1000,
    desc: "Full-time workers",
    recommended: true,
  },
  {
    id: "premium" as const,
    name: "Premium",
    premium: 299,
    maxPayout: 2000,
    desc: "High earners",
    recommended: false,
  },
];

const Onboard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    swiggy_id: "",
    upi_id: "",
    city: "",
    zone: "",
    pincode: "",
    tier: "standard" as PremiumTier,
  });

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));
  const selectedTier = tiers.find((t) => t.id === form.tier)!;

  const premiumPreview = useMemo(() => {
    const zoneRisk = getZoneRiskScore(form.pincode);
    const month = new Date().getMonth() + 1;
    return calculatePremium(zoneRisk, 1000, 100, form.tier, 15, 100, month);
  }, [form.tier, form.pincode]);

  const handleSubmit = async () => {
    setLoading(true);

    if (!form.upi_id.match(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/)) {
      toast.error("Please enter a valid UPI ID (e.g., name@ybl)");
      setLoading(false);
      return;
    }

    try {
      const zoneRisk = getZoneRiskScore(form.pincode);
      const month = new Date().getMonth() + 1;
      const cityNormalized =
        form.city.toLowerCase().replace(" ", "") || "bangalore";

      const zoneRiskScore = zoneRisk;

      const mlResult = await fetchMLPremium({
        zone_risk_score: zoneRiskScore,
        earnings_baseline: 1000,
        trust_score: 100,
        past_claims_count: 0,
        claim_approval_rate: 1.0,
        weeks_active: 1,
        forecast_rain_mm: 15.0,
        forecast_aqi: 100,
        tier: form.tier,
        city: cityNormalized,
        month: month,
      });

      const localCalculation = calculatePremium(
        zoneRiskScore,
        1000,
        100,
        form.tier,
        15,
        100,
        month
      );
      const premium = mlResult?.premium ?? localCalculation.premium;
      const premiumExplainer = mlResult?.explainer ?? localCalculation.explainer;

      console.log("Premium Calculation:", {
        used: mlResult ? "ML" : "Local",
        premium: premium,
        explainer: premiumExplainer,
      });

      const today = new Date();
      const end = new Date(today);
      end.setDate(end.getDate() + 7);

      const phoneNorm = `+91 ${form.phone.replace(/\s/g, "").replace(/^\+91/, "")}`;

      const { data: worker, error: wErr } = await supabase
        .from("workers")
        .insert({
          name: form.name,
          phone: phoneNorm,
          swiggy_id: form.swiggy_id,
          city: form.city,
          zone: form.zone,
          pincode: form.pincode,
          trust_score: 100,
          earnings_baseline: 1000,
          upi_id: form.upi_id,
        })
        .select()
        .single();

      if (wErr) throw wErr;

      const { error: pErr } = await supabase.from("policies").insert({
        worker_id: worker.id,
        tier: form.tier,
        weekly_premium: premium,
        max_payout: TIER_MAX_PAYOUT[form.tier],
        status: "active",
        start_date: today.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
        renewal_date: end.toISOString().split("T")[0],
      });

      if (pErr) {
        await supabase.from("workers").delete().eq("id", worker.id);
        throw pErr;
      }

      setStoredWorkerId(worker.id);

      toast.success("Coverage activated! Welcome to Nimbus.");
      navigate("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const canNext =
    step === 1
      ? !!(form.name && form.phone && form.swiggy_id && form.upi_id)
      : step === 2
      ? !!(form.city && form.zone && form.pincode)
      : true;

  const stepIcons = [User, MapPin, Shield];
  const stepLabels = ["Personal Details", "Location", "Coverage"];

  const hasLocationData = form.city && form.zone && form.pincode;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          {stepLabels.map((label, i) => {
            const Icon = stepIcons[i];
            const active = i + 1 <= step;
            return (
              <div
                key={label}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="hidden sm:inline">{label}</span>
              </div>
            );
          })}
        </div>
        <Progress value={(step / 3) * 100} className="h-1.5" />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Main form card */}
        <div className="flex-1 glass-card rounded-2xl p-6 card-enter">
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl font-bold">Personal Details</h2>
                <p className="text-sm text-muted-foreground">
                  Tell us about yourself to get started.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  placeholder="e.g. Rajan Kumar"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                    +91
                  </span>
                  <Input
                    className="rounded-l-none"
                    placeholder="98765 43210"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Swiggy Partner ID</Label>
                <Input
                  placeholder="e.g. SWG-BLR-2847"
                  value={form.swiggy_id}
                  onChange={(e) => update("swiggy_id", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>UPI ID</Label>
                <Input
                  placeholder="e.g. rajan@ybl"
                  value={form.upi_id}
                  onChange={(e) => update("upi_id", e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl font-bold">Location</h2>
                <p className="text-sm text-muted-foreground">
                  Your delivery zone determines your risk profile.
                </p>
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Select
                  value={form.city}
                  onValueChange={(v) => update("city", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Zone / Area</Label>
                <Input
                  placeholder="e.g. Koramangala"
                  value={form.zone}
                  onChange={(e) => update("zone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input
                  placeholder="e.g. 560034"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) => update("pincode", e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl font-bold">Choose Coverage</h2>
                <p className="text-sm text-muted-foreground">
                  Select a plan that fits your earning pattern.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {tiers.map((t) => {
                  const selected = form.tier === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => update("tier", t.id)}
                      className={[
                        "relative rounded-2xl border-2 p-5 text-left transition-all duration-200",
                        selected
                          ? "border-primary bg-primary/8 shadow-[0_0_20px_rgba(99,179,237,0.12)]"
                          : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5",
                      ].join(" ")}
                    >
                      {t.recommended && (
                        <span className="absolute -top-3 left-4 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground tracking-wide">
                          RECOMMENDED
                        </span>
                      )}
                      <h3 className="text-base font-bold">{t.name}</h3>
                      <p className="mt-2 text-2xl font-extrabold text-primary">
                        ₹{t.premium}
                        <span className="text-sm font-normal text-muted-foreground">
                          /week
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Up to ₹{t.maxPayout.toLocaleString()}/week
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t.desc}
                      </p>
                      {selected && (
                        <CheckCircle className="absolute bottom-4 right-4 h-4 w-4 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="gap-2 border-white/10 bg-white/5 hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <div />
            )}
            {step < 3 ? (
              <Button
                disabled={!canNext}
                onClick={() => setStep(step + 1)}
                className="gap-2"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                disabled={loading}
                onClick={handleSubmit}
                className="gap-2 min-w-[160px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Activating...
                  </>
                ) : (
                  <>
                    Activate Coverage <CheckCircle className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="h-fit w-full glass-card rounded-2xl p-6 lg:w-72 card-enter card-enter-delay-1">
          <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Your Summary
          </h3>
          <div className="space-y-2.5 text-sm">
            {form.name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-semibold text-right max-w-[140px] truncate">
                  {form.name}
                </span>
              </div>
            )}
            {form.phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-semibold">+91 {form.phone}</span>
              </div>
            )}
            {form.swiggy_id && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Partner ID</span>
                <span className="font-semibold font-mono text-xs">
                  {form.swiggy_id}
                </span>
              </div>
            )}
            {form.upi_id && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">UPI ID</span>
                <span className="font-semibold text-xs">{form.upi_id}</span>
              </div>
            )}
            {form.city && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">City</span>
                <span className="font-semibold">{form.city}</span>
              </div>
            )}
            {form.zone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Zone</span>
                <span className="font-semibold">{form.zone}</span>
              </div>
            )}
            {form.pincode && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pincode</span>
                <span className="font-semibold">{form.pincode}</span>
              </div>
            )}

            <div className="my-3 border-t border-white/[0.08]" />

            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-semibold">{selectedTier.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Payout</span>
              <span className="font-semibold">
                ₹{selectedTier.maxPayout.toLocaleString()}/week
              </span>
            </div>
          </div>

          {/* Premium result panel — hero moment */}
          {hasLocationData ? (
            <div className="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Why this price?
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    riskLevelLabel(getZoneRiskScore(form.pincode)) === "HIGH"
                      ? "badge-high"
                      : riskLevelLabel(getZoneRiskScore(form.pincode)) ===
                        "MEDIUM"
                      ? "badge-medium"
                      : "badge-normal"
                  }`}
                >
                  {riskLevelLabel(getZoneRiskScore(form.pincode))} Risk
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {premiumPreview.explainer}
              </p>
              <div className="mt-3 border-t border-primary/20 pt-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    Weekly Premium
                  </span>
                  <span className="flex items-center gap-1 text-xl font-extrabold text-primary">
                    <IndianRupee className="h-4 w-4" />
                    {premiumPreview.premium}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center text-xs text-muted-foreground">
              Complete city, zone, and tier to see your personalized weekly
              premium.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboard;
