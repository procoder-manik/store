"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { blocksSchema } from "@/lib/blocks";

const schema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "The page address can only use lowercase letters, numbers and dashes"),
  title: z.string().trim().min(1, "Add a page title").max(120),
  description: z.string().trim().max(170),
  status: z.enum(["draft", "active"]),
  blocks: blocksSchema,
  kind: z.enum(["page", "landing"]).default("page"),
});

export async function savePage(input: unknown): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const d = p.data;
  let ctx;
  try { ctx = await requireAdmin("page.save"); } catch (e) { return { ok: false, error: (e as Error).message }; }
  let oldSlug: string | undefined;
  if (d.id) oldSlug = (await ctx.supabase.from("pages").select("slug").eq("id", d.id).maybeSingle()).data?.slug as string | undefined;
  // The kind column comes from supabase-0012. Normal pages keep working without it.
  const row = { slug: d.slug, title: d.title, description: d.description || null, status: d.status, blocks: d.blocks, updated_at: new Date().toISOString(), ...(d.kind === "landing" ? { kind: "landing" } : {}) };
  const base = d.kind === "landing" ? "/lp/" : "/p/";
  const q = ctx.supabase.from("pages");
  const { data, error } = d.id ? await q.update(row).eq("id", d.id).select("id").single() : await q.insert(row).select("id").single();
  if (error || !data) return { ok: false, error: error?.code === "23505" ? "That page address is already used." : error?.message ?? "Could not save" };
  if (oldSlug && oldSlug !== d.slug) {
    await ctx.supabase.from("redirects").delete().eq("from_path", `${base}${d.slug}`);
    await ctx.supabase.from("redirects").upsert({ from_path: `${base}${oldSlug}`, to_path: `${base}${d.slug}` }, { onConflict: "from_path" });
  }
  revalidatePath("/admin/pages");
  revalidatePath(`${base}${d.slug}`);
  revalidatePath(`/${d.slug}`);
  revalidatePath("/", "layout");
  return { ok: true, id: data.id as string };
}

export async function deletePage(id: string) {
  const uuid = z.string().uuid().parse(id);
  const { supabase } = await requireAdmin("page.delete");
  await supabase.from("pages").delete().eq("id", uuid);
  revalidatePath("/admin/pages");
  revalidatePath("/", "layout");
}
