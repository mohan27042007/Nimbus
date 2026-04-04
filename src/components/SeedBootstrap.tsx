import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ensureSeedData } from "@/lib/nimbusSeed";

/** Runs once on app load so an empty DB gets Rajan + demo claims. */
export function SeedBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureSeedData();
      } catch (e) {
        console.error("SeedBootstrap:", e);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  return <>{children}</>;
}
