import { PageBuilder, type PageInitial } from "@/components/admin/PageBuilder";
import { getCatalog } from "@/lib/catalog";
import { landingStarter } from "@/lib/landing-starter";
import { createClient } from "@/lib/supabase/server";

export default async function NewLanding() {
  const supabase = await createClient();
  const [{ products, categories }, { data: z }] = await Promise.all([getCatalog(), supabase.from("shipping_zones").select("id, name, fee, free_over").eq("active", true).order("sort")]);
  const initial: PageInitial = { slug: "", title: "", description: "", status: "draft", blocks: landingStarter(products) };
  const zones = (z ?? []).map((x) => ({ id: x.id as string, name: x.name as string, fee: Number(x.fee), freeOver: x.free_over == null ? null : Number(x.free_over) }));
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">New landing page</h1>
      <p className="mb-6 mt-1 max-w-2xl text-sm text-muted">This starts with a ready layout. Change the text, add sections, drag them into the order you want, and set your offers in the Order form block.</p>
      <PageBuilder initial={initial} products={products} categories={categories} kind="landing" zones={zones} />
    </>
  );
}
