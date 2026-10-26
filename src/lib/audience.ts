import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Person = { email: string; name: string };
export type Audience = "subscribers" | "customers" | "vip";

/** Everyone who can be emailed for an audience, without duplicates and without anyone who opted out. */
export async function getAudience(db: SupabaseClient, audience: Audience): Promise<Person[]> {
  const { data: out } = await db.from("email_optouts").select("email");
  const blocked = new Set((out ?? []).map((o) => String(o.email).toLowerCase()));
  const map = new Map<string, Person>();
  const add = (email: unknown, name: unknown) => {
    const e = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (e && !blocked.has(e) && !map.has(e)) map.set(e, { email: e, name: typeof name === "string" ? name : "" });
  };
  if (audience === "subscribers") {
    const { data } = await db.from("leads").select("email, name").not("email", "is", null).eq("unsubscribed", false).limit(5000);
    (data ?? []).forEach((l) => add(l.email, l.name));
  } else {
    const { data } = await db.rpc("crm_customers");
    ((data ?? []) as { email: string | null; name: string; segment: string }[]).filter((c) => audience === "customers" || c.segment === "vip").forEach((c) => add(c.email, c.name));
  }
  return [...map.values()];
}
