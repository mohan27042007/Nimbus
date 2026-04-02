import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle, User, MapPin, Shield } from "lucide-react";
import { calculatePremium } from "@/utils/premium";

const cities = ["Bangalore", "Mumbai", "Delhi", "Chennai", "Hyderabad"];

const tiers = [
  { id: "basic", name: "Basic", premium: 99, maxPayout: 500, desc: "Part-time workers", recommended: false },
  { id: "standard", name: "Standard", premium: 179, maxPayout: 1000, desc: "Full-time workers", recommended: true },
  { id: "premium", name: "Premium", premium: 299, maxPayout: 2000, desc: "High earners", recommended: false },
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
    tier: "standard",
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const selectedTier = tiers.find((t) => t.id === form.tier)!;

  const premiumPreview = useMemo(() => {
    return calculatePremium({
      tierId: form.tier,
      city: form.city,
      zone: form.zone,
      pincode: form.pincode,
      trustScore: 75,
    });
  }, [form.tier, form.city, form.zone, form.pincode]);

  const handleSubmit = async () => {
    setLoading(true);
    
    // Validate UPI
    if (!form.upi_id.match(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/)) {
      toast.error("Please enter a valid UPI ID (e.g., name@ybl)");
      setLoading(false);
      return;
    }

    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      const { data: worker, error: wErr } = await supabase.from("workers").insert({
        user_id: userId,
        name: form.name,
        phone: `+91 ${form.phone}`,
        swiggy_id: form.swiggy_id,
        city: form.city,
        zone: form.zone,
        pincode: form.pincode,
        trust_score: 100,
        earnings_baseline: 1000,
        upi_id: form.upi_id,
      }).select().single();

      if (wErr) throw wErr;

      const { error: pErr } = await supabase.from("policies").insert({
        worker_id: worker.id,
        tier: form.tier,
        weekly_premium: premiumPreview.finalPremium,
        max_payout: selectedTier.maxPayout,
        status: "active",
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
        renewal_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      });

      if (pErr) {
        // Client-side rollback: destroy the orphaned worker cleanly 
        await supabase.from("workers").delete().eq("id", worker.id);
        throw pErr;
      }

      toast.success(`Coverage activated! Welcome to Nimbus, ${form.name} 🎉`);
      navigate("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const canNext = step === 1
    ? form.name && form.phone && form.swiggy_id && form.upi_id
    : step === 2
    ? form.city && form.zone && form.pincode
    : true;

  const stepIcons = [User, MapPin, Shield];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {["Personal Details", "Location", "Coverage"].map((label, i) => {
            const Icon = stepIcons[i];
            return (
              <div key={label} className={`flex items-center gap-2 text-sm font-medium ${i + 1 <= step ? "text-primary" : "text-muted-foreground"}`}>
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </div>
            );
          })}
        </div>
        <Progress value={(step / 3) * 100} className="h-2" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Form */}
        <div className="flex-1 rounded-2xl border border-border bg-card p-6">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold">Personal Details</h2>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="e.g. Rajan Kumar" value={form.name} onChange={(e) => update("name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">+91</span>
                  <Input className="rounded-l-none" placeholder="98765 43210" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Swiggy Partner ID</Label>
                <Input placeholder="e.g. SWG-BLR-2847" value={form.swiggy_id} onChange={(e) => update("swiggy_id", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>UPI ID</Label>
                <Input placeholder="e.g. rajan@ybl" value={form.upi_id} onChange={(e) => update("upi_id", e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold">Location</h2>
              <div className="space-y-2">
                <Label>City</Label>
                <Select value={form.city} onValueChange={(v) => update("city", v)}>
                  <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Zone / Area</Label>
                <Input placeholder="e.g. Koramangala" value={form.zone} onChange={(e) => update("zone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input placeholder="e.g. 560034" maxLength={6} value={form.pincode} onChange={(e) => update("pincode", e.target.value)} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold">Choose Coverage</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {tiers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => update("tier", t.id)}
                    className={`relative rounded-2xl border-2 p-5 text-left transition-all ${
                      form.tier === t.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    {t.recommended && (
                      <span className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                        RECOMMENDED
                      </span>
                    )}
                    <h3 className="text-lg font-semibold">{t.name}</h3>
                    <p className="text-2xl font-bold text-primary mt-1">₹{t.premium}<span className="text-sm text-muted-foreground font-normal">/week</span></p>
                    <p className="text-sm text-muted-foreground mt-1">Up to ₹{t.maxPayout.toLocaleString()}/week</p>
                    <p className="text-xs text-muted-foreground mt-2">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : <div />}
            {step < 3 ? (
              <Button disabled={!canNext} onClick={() => setStep(step + 1)} className="gap-2">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button disabled={loading} onClick={handleSubmit} className="gap-2">
                {loading ? "Activating..." : "Activate Coverage"} <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72 rounded-2xl border border-border bg-card p-6 h-fit">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Summary</h3>
          <div className="space-y-3 text-sm">
            {form.name && <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{form.name}</span></div>}
            {form.phone && <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">+91 {form.phone}</span></div>}
            {form.swiggy_id && <div><span className="text-muted-foreground">Partner ID:</span> <span className="font-medium">{form.swiggy_id}</span></div>}
            {form.upi_id && <div><span className="text-muted-foreground">UPI ID:</span> <span className="font-medium">{form.upi_id}</span></div>}
            {form.city && <div><span className="text-muted-foreground">City:</span> <span className="font-medium">{form.city}</span></div>}
            {form.zone && <div><span className="text-muted-foreground">Zone:</span> <span className="font-medium">{form.zone}</span></div>}
            {form.pincode && <div><span className="text-muted-foreground">Pincode:</span> <span className="font-medium">{form.pincode}</span></div>}
            <hr className="border-border" />
            <div><span className="text-muted-foreground">Plan:</span> <span className="font-medium">{selectedTier.name}</span></div>
            <div><span className="text-muted-foreground">Max Payout:</span> <span className="font-medium">₹{selectedTier.maxPayout.toLocaleString()}/week</span></div>
            
            {(form.city && form.zone) ? (
              <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3 text-xs">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-border text-sm font-medium">
                   <span>Why this price?</span>
                   <span className="capitalize text-muted-foreground">{premiumPreview.riskLevel} Risk</span>
                </div>
                <div className="space-y-1.5">
                  {premiumPreview.explanation.length > 0 && premiumPreview.explanation.slice(0, -1).map((item, idx) => (
                     <div key={idx} className="flex justify-between text-muted-foreground">
                        <span>{item.label}</span>
                        <span className={item.type === "discount" ? "text-emerald-500" : ""}>{item.displayValue}</span>
                     </div>
                  ))}
                  <div className="flex justify-between font-semibold text-primary pt-2 mt-2 border-t border-border text-sm">
                    <span>Weekly Premium</span>
                    <span>₹{premiumPreview.finalPremium}</span>
                  </div>
                </div>
              </div>
            ) : (
               <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground text-center">
                 Complete city, zone, and tier to see your personalized weekly premium.
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboard;
