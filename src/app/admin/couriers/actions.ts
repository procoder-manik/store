"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { courierDef } from "@/lib/couriers";
import { removeCourier, saveCourier, setCourierEnabled } from "@/lib/courier-config";
import { testCourier } from "@/lib/courier-book";

const value = z.string().trim().max(400).regex(/^\S*$/, "Keys cannot have spaces in them.");

export async function saveCourierKeys(input: { id: string; values: Record<string, string>; live: boolean; enabled: boolean }): Promise<{ ok: boolean; error?: string }> {
  const def = courierDef(input.id);
  if (!def) return { ok: false, error: "Unknown courier." };
  const values: Record<string, string> = {};
  for (const f of def.fields) {
    const raw = input.values[f.name] ?? "";
    // The email field may contain an @, so only the secret keys are space-checked strictly.
    const parsed = (f.name === "username" ? z.string().trim().max(400) : value).safeParse(raw);
    if (!parsed.success) return { ok: false, error: `${def.name} ${f.label}: ${parsed.error.issues[0].message}` };
    values[f.name] = parsed.data;
  }
  try {
    await requireAdmin("courier.save");
    await saveCourier(input.id, { values, live: !!input.live, enabled: !!input.enabled });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath("/admin/couriers");
  revalidatePath("/admin/orders", "layout");
  return { ok: true };
}

export async function toggleCourier(id: string, enabled: boolean): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin("courier.toggle");
    await setCourierEnabled(id, enabled);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath("/admin/couriers");
  revalidatePath("/admin/orders", "layout");
  return { ok: true };
}

export async function removeCourierKeys(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin("courier.remove");
    await removeCourier(id);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath("/admin/couriers");
  revalidatePath("/admin/orders", "layout");
  return { ok: true };
}

export async function testCourierKeys(id: string): Promise<{ ok: boolean; error?: string; detail?: string }> {
  try {
    await requireAdmin("courier.test");
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  return testCourier(id);
}
