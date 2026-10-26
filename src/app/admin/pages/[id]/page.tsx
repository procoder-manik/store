import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCatalog } from "@/lib/catalog";
import { blocksSchema } from "@/lib/blocks";
import { PageBuilder, type PageInitial } from "@/components/admin/PageBuilder";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: p }, { products, categories }] = await Promise.all([supabase.from("pages").select("*").eq("id", id).maybeSingle(), getCatalog()]);
  if (!p) notFound();
  const parsed = blocksSchema.safeParse(p.blocks);
  const initial: PageInitial = { id: p.id, slug: p.slug, title: p.title, description: p.description ?? "", status: p.status, blocks: parsed.success ? parsed.data : [] };
  return (<><h1 className="mb-6 font-display text-2xl font-semibold">Edit page</h1><PageBuilder initial={initial} products={products} categories={categories} /></>);
}
