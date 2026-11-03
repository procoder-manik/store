import "server-only";
import { open, seal } from "@/lib/ai-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { COURIERS, courierDef, courierName } from "@/lib/couriers";

const KEY = "courier_secrets";

// One courier's saved settings. Each credential value is scrambled, and only the server can read it back.
type SavedCourier = { enabled?: boolean; live?: boolean; creds?: Record<string, string> };
type Saved = Record<string, SavedCourier>;

export type CourierCreds = { live: boolean; values: Record<string, string> };
export type CourierStatus = {
  id: string;
  configured: boolean;
  enabled: boolean;
  live: boolean;
  source: "backend" | "env" | "none";
  tails: Record<string, string>; // last 4 characters of each saved value, to confirm which keys are in place
};

let cache: { at: number; value: Saved } | null = null;

async function read(): Promise<Saved> {
  if (cache && Date.now() - cache.at < 20_000) return cache.value;
  try {
    const { data } = await createAdminClient().from("site_settings").select("value").eq("key", KEY).maybeSingle();
    const value = (data?.value ?? {}) as Saved;
    cache = { at: Date.now(), value };
    return value;
  } catch {
    return {};
  }
}

async function write(value: Saved) {
  const { error } = await createAdminClient().from("site_settings").upsert({ key: KEY, value, is_public: false }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  cache = null;
}

// Older stores set the Steadfast keys in the hosting settings. Those still work if nothing is saved in Admin.
function steadfastEnv(): CourierCreds | null {
  if (process.env.STEADFAST_API_KEY && process.env.STEADFAST_SECRET_KEY) return { live: true, values: { api_key: process.env.STEADFAST_API_KEY, secret_key: process.env.STEADFAST_SECRET_KEY } };
  return null;
}

/** The working keys for one courier, unscrambled. Keys saved in Admin win over the hosting settings. */
export async function courierCreds(id: string): Promise<CourierCreds | null> {
  const def = courierDef(id);
  if (!def) return null;
  const s = (await read())[id];
  if (s?.creds) {
    const values: Record<string, string> = {};
    for (const f of def.fields) {
      const v = s.creds[f.name];
      values[f.name] = v ? open(v) : "";
    }
    if (def.fields.every((f) => f.optional || values[f.name])) return { live: !!s.live, values };
  }
  return id === "steadfast" ? steadfastEnv() : null;
}

/** What the Admin page shows for every courier, without revealing any key. */
export async function courierStatuses(): Promise<CourierStatus[]> {
  const saved = await read();
  return COURIERS.map((def) => {
    const s = saved[def.id];
    const tails: Record<string, string> = {};
    let configured = false;
    let source: CourierStatus["source"] = "none";
    let live = !!s?.live;
    if (s?.creds && def.fields.every((f) => f.optional || s.creds?.[f.name])) {
      configured = true;
      source = "backend";
      for (const f of def.fields) {
        const v = s.creds[f.name];
        tails[f.name] = v ? open(v).slice(-4) : "";
      }
    } else if (def.id === "steadfast" && steadfastEnv()) {
      configured = true;
      source = "env";
      live = true;
    }
    // A courier set in the hosting settings is on by default; one saved here follows its own switch.
    const enabled = configured && (source === "env" ? true : s?.enabled === true);
    return { id: def.id, configured, enabled, live, source, tails };
  });
}

/** The first switched-on courier that can book parcels straight from an order. */
export async function autoBookCourier(): Promise<{ id: string; name: string } | null> {
  const hit = (await courierStatuses()).find((s) => s.enabled && courierDef(s.id)?.autoBook);
  return hit ? { id: hit.id, name: courierName(hit.id) } : null;
}

export async function saveCourier(id: string, input: { values: Record<string, string>; live: boolean; enabled: boolean }) {
  const def = courierDef(id);
  if (!def) throw new Error("Unknown courier.");
  const saved = await read();
  const prev = saved[id]?.creds ?? {};
  const creds: Record<string, string> = {};
  for (const f of def.fields) {
    const v = (input.values[f.name] ?? "").trim();
    if (v) creds[f.name] = seal(v);
    else if (prev[f.name]) creds[f.name] = prev[f.name]; // an empty box keeps the saved value
  }
  const missing = def.fields.find((f) => !f.optional && !creds[f.name]);
  if (missing) throw new Error(`Add the ${def.name} ${missing.label.toLowerCase()} before turning it on.`);
  saved[id] = { enabled: input.enabled, live: input.live, creds };
  await write(saved);
}

export async function setCourierEnabled(id: string, enabled: boolean) {
  const saved = await read();
  if (!saved[id]) throw new Error("Save the keys first.");
  saved[id] = { ...saved[id], enabled };
  await write(saved);
}

export async function removeCourier(id: string) {
  const saved = await read();
  delete saved[id];
  await write(saved);
}
