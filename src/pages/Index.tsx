import { Link } from "react-router-dom";
import { Cloud, Shield, Zap, Users, ArrowRight, ShieldCheck, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Shield,
    title: "Parametric Protection",
    desc: "Automatic payouts triggered by weather, air quality, and platform disruptions — no claims to file, no paperwork, no waiting.",
    image: "/feature-shield.png",
    tag: "Always-on Coverage",
  },
  {
    icon: Zap,
    title: "Instant Payouts",
    desc: "Money hits your UPI within minutes of a qualifying disruption. Our AI engine calculates your exact coverage automatically.",
    image: "/feature-payout.png",
    tag: "Seconds, Not Days",
  },
  {
    icon: Users,
    title: "Built for Gig Workers",
    desc: "Affordable weekly premiums starting at ₹99. Designed specifically for Swiggy & Zomato delivery partners across India.",
    image: "/feature-workers.png",
    tag: "₹99/week to start",
  },
];

const Index = () => {
  return (
    <div className="overflow-x-hidden">
      {/* ── Hero Section ──────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center py-16 relative">
        <div className="relative mb-6">
          <Cloud className="h-16 w-16 text-primary mx-auto" />
          <ShieldCheck className="absolute -bottom-1 -right-1 h-6 w-6 text-emerald-400 bg-background rounded-full p-0.5" />
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #63B3ED 0%, #a78bfa 50%, #63B3ED 100%)",
            }}
          >
            NIMBUS
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light mb-8">
          AI-powered parametric income insurance for food delivery partners.
          <br className="hidden sm:block" />
          Automatic payouts, zero paperwork.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="gap-2 px-6 font-semibold">
            <Link to="/onboard">
              Get Coverage <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="px-6 border-muted-foreground/30 hover:bg-muted/50 transition-all"
          >
            <Link to="/dashboard">View Demo Dashboard</Link>
          </Button>
        </div>

        {/* Trust pills */}
        <div className="flex flex-wrap items-center justify-center gap-5 mt-10 text-xs text-muted-foreground">
          {["AI-Verified Payouts", "UPI in Minutes", "No Claims to File"].map(
            (label) => (
              <span key={label} className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                {label}
              </span>
            )
          )}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground/60 animate-bounce">
          <span className="text-xs font-medium tracking-widest uppercase">Scroll</span>
          <ChevronDown className="h-4 w-4" />
        </div>
      </section>

      {/* ── Feature Sections ──────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pb-24 space-y-32">
        {features.map((f, i) => {
          const isReversed = i % 2 === 1;
          return (
            <section
              key={f.title}
              className={`flex flex-col gap-10 items-center ${
                isReversed ? "lg:flex-row-reverse" : "lg:flex-row"
              }`}
            >
              {/* Image */}
              <div className="flex-1 w-full">
                <div className="glass-card rounded-3xl overflow-hidden aspect-square max-w-[420px] mx-auto lg:mx-0">
                  <img
                    src={f.image}
                    alt={f.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Text */}
              <div className="flex-1 space-y-5 text-center lg:text-left">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                  <f.icon className="h-3.5 w-3.5" />
                  {f.tag}
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                  {f.title}
                </h2>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
                  {f.desc}
                </p>
                <Button asChild variant="outline" className="gap-2 border-primary/30 hover:bg-primary/5 hover:border-primary/50 transition-all">
                  <Link to="/onboard">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </section>
          );
        })}
      </div>

      {/* ── Bottom CTA ────────────────────────────────────────── */}
      <section className="glass-card mx-4 md:mx-auto max-w-4xl rounded-3xl p-10 md:p-14 mb-20 text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Ready to protect your income?
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Join delivery partners across India who are already covered by Nimbus. Get started in under 2 minutes.
        </p>
        <Button asChild size="lg" className="gap-2 px-8 font-semibold">
          <Link to="/onboard">
            Get Coverage <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
};

export default Index;
