"use server";

import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { imageUrl } from "@/lib/utils";

/** Every picture already uploaded to the store, newest first, for the "Choose from library" button. */
export async function listLibrary(): Promise<{ ok: boolean; images: string[]; error?: string }> {
  try { await requireAdmin(); } catch (e) { return { ok: false, images: [], error: (e as Error).message }; }
  const { data, error } = await createAdminClient().storage.from("product-images").list("", { limit: 300, sortBy: { column: "created_at", order: "desc" } });
  if (error) return { ok: false, images: [], error: error.message };
  return { ok: true, images: (data ?? []).filter((f) => f.id && /\.(png|jpe?g|webp|avif)$/i.test(f.name)).map((f) => imageUrl(f.name)) };
}
