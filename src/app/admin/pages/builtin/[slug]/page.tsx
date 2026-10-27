import { notFound } from "next/navigation";
import { PageBuilder, type PageInitial } from "@/components/admin/PageBuilder";
import { blocksSchema } from "@/lib/blocks";
import { BUILTIN, defaultBlocks } from "@/lib/builtin-pages";
import { getCatalog } from "@/lib/catalog";
import { getPublicSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

export default async function EditBuiltin({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = BUILTIN.find((b) => b.slug === slug);
  if (!meta) notFound();
  const supabase = await createClient();
  const [{ data: p }, { products, categories }, { brand, contact }] = await Promise.all([supabase.from("pages").select("*").eq("slug", slug).maybeSingle(), getCatalog(), getPublicSettings()]);
  const parsed = p ? blocksSchema.safeParse(p.blocks) : null;
  const initial: PageInitial = p
    ? { id: p.id, slug, title: p.title, description: p.description ?? "", status: p.status, blocks: parsed?.success ? parsed.data : [] }
    : { slug, title: meta.title, description: "", status: "active", blocks: defaultBlocks(slug, brand.name, contact.email) };
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">{meta.title}</h1>
      <p className="mb-6 mt-1 max-w-2xl text-sm text-muted">{p ? "This is your edited version." : "This starts as the built-in version, split into sections you can edit."} Pressing Save puts your version live on the store. Reset to built-in brings the original back.</p>
      <PageBuilder initial={initial} products={products} categories={categories} builtin={{ path: meta.path }} />
    </>
  );
}
