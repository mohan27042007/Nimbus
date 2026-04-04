import { supabase } from "@/integrations/supabase/client";
import { NIMBUS_WORKER_ID_KEY } from "@/lib/constants";

export function getStoredWorkerId(): string | null {
  return localStorage.getItem(NIMBUS_WORKER_ID_KEY);
}

export function setStoredWorkerId(id: string): void {
  localStorage.setItem(NIMBUS_WORKER_ID_KEY, id);
}

/** Resolve worker id: localStorage → Rajan by phone → first worker. */
export async function resolveWorkerId(): Promise<string | null> {
  const stored = getStoredWorkerId();
  if (stored) return stored;

  const { data: rajan } = await supabase
    .from("workers")
    .select("id")
    .eq("phone", "+91 98765 43210")
    .maybeSingle();

  if (rajan?.id) {
    setStoredWorkerId(rajan.id);
    return rajan.id;
  }

  const { data: byName } = await supabase
    .from("workers")
    .select("id")
    .eq("name", "Rajan Kumar")
    .limit(1)
    .maybeSingle();

  if (byName?.id) {
    setStoredWorkerId(byName.id);
    return byName.id;
  }

  const { data: first } = await supabase
    .from("workers")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (first?.id) {
    setStoredWorkerId(first.id);
    return first.id;
  }

  return null;
}
