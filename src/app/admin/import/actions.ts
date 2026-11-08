"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { CURRENCIES, createImportToken, saveImportSettings } from "@/lib/import-config";

const rate = z.coerce.number().positive("Each rate must be more than 0").max(100000);

export async function saveImportOptions(input: { rates: Record<string, string>; extra: string; categoryId: string; ai: boolean }): Promise<{ ok: boolean; error?: string }> {
  const rates: Record<string, number> = {};
  for (const c of CURRENCIES) {
    const r = rate.safeParse(input.rates[c]);
    if (!r.success) return { ok: false, error: `${c}: ${r.error.issues[0].message}` };
    rates[c] = r.data;
  }
  const extra = z.coerce.number().min(0, "The amount added cannot be negative").max(1_000_000).safeParse(input.extra);
  if (!extra.success) return { ok: false, error: extra.error.issues[0].message };
  const category = z.union([z.literal(""), z.string().uuid()]).safeParse(input.categoryId);
  if (!category.success) return { ok: false, error: "Choose a category from the list." };
  try {
    await requireAdmin("import.settings");
    await saveImportSettings({ rates: rates as never, extra: extra.data, categoryId: category.data, ai: !!input.ai });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath("/admin/import");
  return { ok: true };
}

/** Makes a new import token. The old one stops working at once. The token is shown once and never stored in readable form. */
export async function makeImportToken(): Promise<{ ok: boolean; token?: string; error?: string }> {
  try {
    await requireAdmin("import.token");
    const token = await createImportToken();
    revalidatePath("/admin/import");
    return { ok: true, token };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
