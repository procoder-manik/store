import { notFound } from "next/navigation";
import { PageBuilder, type PageInitial } from "@/components/admin/PageBuilder";
import { blocksSchema } from "@/lib/blocks";
import { getCatalog } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export default async function EditLanding({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: p }, { products, categories }, { data: z }] = await Promise.all([supabase.from("pages").select("*").eq("id", id).maybeSingle(), getCatalog(), supabase.from("shipping_zones").select("id, name, fee, free_over").eq("active", true).order("sort")]);
  if (!p) notFound();
  const parsed = blocksSchema.safeParse(p.blocks);
  const initial: PageInitial = { id: p.id, slug: p.slug, title: p.title, description: p.description ?? "", status: p.status, blocks: parsed.success ? parsed.data : [] };
  const zones = (z ?? []).map((x) => ({ id: x.id as string, name: x.name as string, fee: Number(x.fee), freeOver: x.free_over == null ? null : Number(x.free_over) }));
  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-semibold">Edit landing page</h1>
      <PageBuilder initial={initial} products={products} categories={categories} kind="landing" zones={zones} />
    </>
  );
}
