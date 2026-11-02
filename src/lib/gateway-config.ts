import "server-only";
import { open, seal } from "@/lib/ai-config";
import { createAdminClient } from "@/lib/supabase/admin";

const KEY = "gateway_secrets";

type Saved = { ssl?: { storeId?: string; password?: string; live?: boolean } };
export type SslConfig = { storeId: string; password: string; live: boolean; source: "backend" | "env" };

let cache: { at: number; value: SslConfig | null } | null = null;

async function read(): Promise<Saved> {
  try {
    const { data } = await createAdminClient().from("site_settings").select("value").eq("key", KEY).maybeSingle();
    return (data?.value ?? {}) as Saved;
  } catch {
    return {};
  }
}

/** The SSLCommerz keys in use. Keys saved in Admin win over the .env file. The password is stored scrambled, and only the server can read it. */
export async function sslConfig(): Promise<SslConfig | null> {
  if (cache && Date.now() - cache.at < 20_000) return cache.value;
  const s = (await read()).ssl;
  const password = s?.password ? open(s.password) : "";
  let value: SslConfig | null = null;
  if (s?.storeId && password) value = { storeId: s.storeId, password, live: !!s.live, source: "backend" };
  else if (process.env.SSLCOMMERZ_STORE_ID && process.env.SSLCOMMERZ_STORE_PASSWORD) value = { storeId: process.env.SSLCOMMERZ_STORE_ID, password: process.env.SSLCOMMERZ_STORE_PASSWORD, live: process.env.SSLCOMMERZ_LIVE === "true", source: "env" };
  cache = { at: Date.now(), value };
  return value;
}

export async function saveSsl(input: { storeId: string; password?: string; live: boolean }) {
  const saved = await read();
  const ssl = { storeId: input.storeId, live: input.live, password: input.password ? seal(input.password) : saved.ssl?.password };
  const { error } = await createAdminClient().from("site_settings").upsert({ key: KEY, value: { ...saved, ssl }, is_public: false }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  cache = null;
}

export async function removeSsl() {
  const { ssl: _gone, ...rest } = await read();
  const { error } = await createAdminClient().from("site_settings").upsert({ key: KEY, value: rest, is_public: false }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  cache = null;
}
