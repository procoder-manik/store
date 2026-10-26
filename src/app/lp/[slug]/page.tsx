import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getCatalog } from "@/lib/catalog";
import { createPublicClient } from "@/lib/supabase/public";
import { LandingView, type LandingData } from "@/components/LandingView";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

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
  const r = await load(slug);
  if (!r) return {};
  return { title: r.landing.headline, description: r.landing.subheadline || undefined };
}

export default async function LandingPage({ params }: Params) {
  const { slug } = await params;
  const r = await load(slug);
  if (!r) notFound();
  return <LandingView landing={r.landing} product={r.product} zones={r.zones} />;
}
