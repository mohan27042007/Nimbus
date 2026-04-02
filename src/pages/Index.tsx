import { Link } from "react-router-dom";
import { Cloud, Shield, Zap, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Hero */}
      <div className="text-center space-y-6 py-16">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Cloud className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          <span className="text-primary">NIMBUS</span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
          AI-powered parametric income insurance for food delivery partners in India
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button asChild size="lg" className="gap-2">
            <Link to="/onboard">
              Get Coverage <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/dashboard">View Demo Dashboard</Link>
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6 py-12">
        {[
          {
            icon: Shield,
            title: "Parametric Protection",
            desc: "Automatic payouts triggered by weather, air quality, and platform disruptions — no claims to file.",
          },
          {
            icon: Zap,
            title: "Instant Payouts",
            desc: "Money hits your UPI within minutes of a qualifying disruption. AI calculates your exact coverage.",
          },
          {
            icon: Users,
            title: "Built for Gig Workers",
            desc: "Affordable weekly premiums starting at ₹99. Designed for Swiggy & Zomato delivery partners.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-border bg-card p-6 space-y-3"
          >
            <f.icon className="h-8 w-8 text-primary" />
            <h3 className="text-lg font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Index;
