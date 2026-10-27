import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { getCatalog } from "@/lib/catalog";
import { createPublicClient } from "@/lib/supabase/public";
import { BlockRenderer } from "@/components/Blocks";
import { LandingView, type LandingData } from "@/components/LandingView";
import { blocksSchema, type Block } from "@/lib/blocks";
import { findRedirect } from "@/lib/redirects";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

type Zone = { id: string; name: string; fee: number; freeOver: number | null };
const zonesOf = (z: { id: unknown; name: unknown; fee: unknown; free_over: unknown }[] | null): Zone[] => (z ?? []).map((x) => ({ id: x.id as string, name: x.name as string, fee: Number(x.fee), freeOver: x.free_over == null ? null : Number(x.free_over) }));

/** A landing page made with the page builder. */
const loadBuilt = cache(async (slug: string) => {
  const sb = createPublicClient();
  if (!sb) return null;
  const { data } = await sb.from("pages").select("title, description, blocks").eq("slug", slug).eq("status", "active").eq("kind", "landing").maybeSingle();
  if (!data) return null;
  const parsed = blocksSchema.safeParse(data.blocks);
  if (!parsed.success) return null;
  const { products, categories } = await getCatalog();
  const { data: z } = await sb.from("shipping_zones").select("id, name, fee, free_over").eq("active", true).order("sort").order("fee");
  return { title: data.title as string, description: (data.description as string) ?? "", blocks: parsed.data as Block[], products, categories, zones: zonesOf(z) };
});

const load = cache(async (slug: string) => {
  const sb = createPublicClient();
  if (!sb) return null;
  const { data: l } = await sb.from("landing_pages").select("*").eq("slug", slug).eq("status", "active").maybeSingle();
  if (!l) return null;
  const { products } = await getCatalog();
  const product = products.find((p) => p.id === l.product_id);
  if (!product) return null;
  const { data: z } = await sb.from("shipping_zones").select("id, name, fee, free_over").eq("active", true).order("sort").order("fee");
  const landing: LandingData = {
    slug: l.slug as string, headline: l.headline as string, subheadline: (l.subheadline as string) ?? "", bullets: (l.bullets as string[]) ?? [],
    heroImage: (l.hero_image as string) ?? "", cta: l.cta_text as string, offers: l.offers as LandingData["offers"],
  };
  const zones = (z ?? []).map((x) => ({ id: x.id as string, name: x.name as string, fee: Number(x.fee), freeOver: x.free_over == null ? null : Number(x.free_over) }));
  return { landing, product, zones };
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const b = await loadBuilt(slug);
  if (b) return { title: b.title, description: b.description || undefined, robots: { index: false, follow: true } };
  const r = await load(slug);
  if (!r) return {};
  return { title: r.landing.headline, description: r.landing.subheadline || undefined, robots: { index: false, follow: true } };
}

export default async function LandingPage({ params }: Params) {
  const { slug } = await params;
  const b = await loadBuilt(slug);
  if (b) {
    const order = b.blocks.find((x) => x.type === "order");
    return (
      <main>
        <BlockRenderer blocks={b.blocks} products={b.products} categories={b.categories} zones={b.zones} slug={slug} />
        {order && order.type === "order" && <a href="#order" className="fixed inset-x-4 bottom-4 z-30 rounded-pill bg-accent py-3.5 text-center text-sm font-semibold text-accent-ink shadow-2xl md:hidden">{order.cta || "Order now"}</a>}
      </main>
    );
  }
  const r = await load(slug);
  if (!r) {
    const to = await findRedirect(`/lp/${slug}`);
    if (to) permanentRedirect(to);
    notFound();
  }
  return <LandingView landing={r.landing} product={r.product} zones={r.zones} />;
}
