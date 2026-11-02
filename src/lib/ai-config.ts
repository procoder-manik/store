import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { PROVIDERS, type ProviderDef, type ProviderKind, type ProviderView } from "@/lib/ai-providers";

/** What is saved for one service. The key is stored scrambled, and only the server can unscramble it. */
export type SavedProvider = { key?: string; enabled?: boolean; models?: string[]; order?: number; custom?: boolean; name?: string; baseUrl?: string };
export type SavedAi = { providers: Record<string, SavedProvider> };

export type Resolved = {
  id: string;
  name: string;
  kind: ProviderKind;
  baseUrl: string;
  key: string;
  models: string[];
  order: number;
  source: "backend" | "env";
};

export const AI_SETTINGS_KEY = "ai_providers";

// The row sits in the settings table, which any staff login can read, so the key is scrambled with a secret that only the server has.
// If that secret is ever changed, saved keys stop working and are asked for again.
const secret = () => scryptSync(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", "store-ai-keys-v1", 32);

export function seal(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", secret(), iv);
  const body = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `v1:${iv.toString("base64")}:${c.getAuthTag().toString("base64")}:${body.toString("base64")}`;
}

export function open(sealed: string): string {
  try {
    const [v, iv, tag, body] = sealed.split(":");
    if (v !== "v1") return "";
    const d = createDecipheriv("aes-256-gcm", secret(), Buffer.from(iv, "base64"));
    d.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([d.update(Buffer.from(body, "base64")), d.final()]).toString("utf8");
  } catch {
    return "";
  }
}

export async function loadSaved(): Promise<SavedAi> {
  try {
    const { data } = await createAdminClient().from("site_settings").select("value").eq("key", AI_SETTINGS_KEY).maybeSingle();
    const v = (data?.value ?? {}) as Partial<SavedAi>;
    return { providers: v.providers ?? {} };
  } catch {
    return { providers: {} };
  }
}

export async function writeSaved(value: SavedAi) {
  const { error } = await createAdminClient().from("site_settings").upsert({ key: AI_SETTINGS_KEY, value, is_public: false, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  cache = null;
}

const envKey = (d: ProviderDef) => d.env.map((n) => process.env[n]?.trim() ?? "").find(Boolean) ?? "";

/** The services in the order they are tried. A key saved in Admin wins over one in the .env file. */
function resolve(saved: SavedAi): { all: ProviderView[]; use: Resolved[] } {
  const rows: { def: ProviderDef; cfg: SavedProvider; custom: boolean }[] = PROVIDERS.map((def) => ({ def, cfg: saved.providers[def.id] ?? {}, custom: false }));
  for (const [id, cfg] of Object.entries(saved.providers)) {
    if (!cfg.custom || !cfg.baseUrl) continue;
    rows.push({ def: { id, name: cfg.name || id, kind: "openai", baseUrl: cfg.baseUrl, env: [], models: cfg.models ?? [], keyUrl: "", note: "Your own connection, for any service that works like OpenAI." }, cfg, custom: true });
  }
  const all: ProviderView[] = [];
  const use: Resolved[] = [];
  rows.forEach(({ def, cfg, custom }, i) => {
    const own = cfg.key ? open(cfg.key) : "";
    const key = own || envKey(def);
    const source = own ? "backend" : key ? "env" : "none";
    // Older settings are honoured: GEMINI_MODEL and ANTHROPIC_MODEL still put one model first.
    const pin = def.id === "gemini" ? process.env.GEMINI_MODEL : def.id === "anthropic" ? process.env.ANTHROPIC_MODEL : "";
    const base = cfg.models?.length ? cfg.models : def.models;
    const models = pin && !cfg.models?.length ? [pin, ...base.filter((m) => m !== pin)] : base;
    const order = cfg.order ?? i + 1;
    const enabled = cfg.enabled !== false;
    all.push({ id: def.id, name: def.name, custom, baseUrl: def.baseUrl, keyUrl: def.keyUrl, note: def.note, enabled, order, models, defaultModels: def.models, source, tail: key ? key.slice(-4) : "", envNames: def.env });
    if (key && enabled && models.length) use.push({ id: def.id, name: def.name, kind: def.kind, baseUrl: def.baseUrl, key, models, order, source: source === "backend" ? "backend" : "env" });
  });
  all.sort((a, b) => a.order - b.order);
  use.sort((a, b) => a.order - b.order);
  return { all, use };
}

let cache: { at: number; value: ReturnType<typeof resolve> } | null = null;

async function current() {
  if (cache && Date.now() - cache.at < 20_000) return cache.value;
  const value = resolve(await loadSaved());
  cache = { at: Date.now(), value };
  return value;
}

/** What the assistant can use right now. */
export async function activeProviders(): Promise<Resolved[]> {
  return (await current()).use;
}

/** Everything the Admin page lists, without any keys. */
export async function providerViews(): Promise<ProviderView[]> {
  cache = null;
  return (await current()).all;
}

export async function providerById(id: string): Promise<Resolved | null> {
  cache = null;
  const { all, use } = await current();
  const hit = use.find((p) => p.id === id);
  if (hit) return hit;
  // A service that is switched off can still be tested.
  const view = all.find((p) => p.id === id);
  if (!view) return null;
  const saved = await loadSaved();
  const def = PROVIDERS.find((p) => p.id === id);
  const cfg = saved.providers[id] ?? {};
  const key = (cfg.key ? open(cfg.key) : "") || (def ? envKey(def) : "");
  return key ? { id, name: view.name, kind: def?.kind ?? "openai", baseUrl: view.baseUrl, key, models: view.models, order: view.order, source: cfg.key ? "backend" : "env" } : null;
}
