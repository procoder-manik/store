import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/** Settings and the access token for the product importer. They sit in private rows of the settings table. */

export const CURRENCIES = ["BDT", "USD", "CAD", "GBP", "EUR", "CNY", "INR", "AED", "AUD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export type ImportSettings = {
  /** Taka for one unit of each currency. Edit these in Admin, Import products. */
  rates: Record<Currency, number>;
  /** Added to every converted price to cover shipping, delivery and your margin. */
  extra: number;
  /** Category new products go into. Empty means the first active category. */
  categoryId: string;
  /** Write the Bangla description with AI when an AI service is connected. */
  ai: boolean;
};

export const DEFAULT_IMPORT: ImportSettings = {
  rates: { BDT: 1, USD: 122, CAD: 88.42, GBP: 155, EUR: 132, CNY: 17, INR: 1.45, AED: 33, AUD: 80 },
  extra: 1000,
  categoryId: "",
  ai: true,
};

const SETTINGS_KEY = "import_settings";
const TOKEN_KEY = "import_token";

async function readRow<T>(key: string): Promise<T | null> {
  try {
    const { data } = await createAdminClient().from("site_settings").select("value").eq("key", key).maybeSingle();
    return (data?.value ?? null) as T | null;
  } catch {
    return null;
  }
}

async function writeRow(key: string, value: object) {
  const { error } = await createAdminClient().from("site_settings").upsert({ key, value, is_public: false }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

export async function loadImportSettings(): Promise<ImportSettings> {
  const saved = await readRow<Partial<ImportSettings>>(SETTINGS_KEY);
  const rates = { ...DEFAULT_IMPORT.rates };
  for (const c of CURRENCIES) {
    const v = Number(saved?.rates?.[c]);
    if (Number.isFinite(v) && v > 0) rates[c] = v;
  }
  const extra = Number(saved?.extra);
  return {
    rates,
    extra: Number.isFinite(extra) && extra >= 0 ? extra : DEFAULT_IMPORT.extra,
    categoryId: typeof saved?.categoryId === "string" ? saved.categoryId : "",
    ai: saved?.ai !== false,
  };
}

export async function saveImportSettings(s: ImportSettings) {
  await writeRow(SETTINGS_KEY, s);
}

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function importTokenInfo(): Promise<{ exists: boolean; createdAt?: string }> {
  const row = await readRow<{ hash?: string; createdAt?: string }>(TOKEN_KEY);
  return row?.hash ? { exists: true, createdAt: row.createdAt } : { exists: false };
}

/** Makes a new token and keeps only its fingerprint, so a leaked database row cannot be used to import. The old token stops working. */
export async function createImportToken(): Promise<string> {
  const token = `sti_${randomBytes(20).toString("hex")}`;
  await writeRow(TOKEN_KEY, { hash: hash(token), createdAt: new Date().toISOString() });
  return token;
}

/** Checks an "Authorization: Bearer ..." header against the saved token. */
export async function verifyImportToken(header: string | null): Promise<boolean> {
  const given = header?.match(/^Bearer\s+(sti_[0-9a-f]{40})$/)?.[1];
  if (!given) return false;
  const row = await readRow<{ hash?: string }>(TOKEN_KEY);
  if (!row?.hash) return false;
  const a = Buffer.from(hash(given));
  const b = Buffer.from(row.hash);
  return a.length === b.length && timingSafeEqual(a, b);
}
