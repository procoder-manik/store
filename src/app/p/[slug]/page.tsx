import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { findRedirect } from "@/lib/redirects";
import { cache } from "react";
import { getCatalog } from "@/lib/catalog";
import { blocksSchema, type Block } from "@/lib/blocks";
import { SITE_URL } from "@/lib/config";
import { createPublicClient } from "@/lib/supabase/public";
import { BlockRenderer } from "@/components/Blocks";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

const load = cache(async (slug: string) => {
  const sb = createPublicClient();
  if (!sb) return null;
  const { data } = await sb.from("pages").select("slug, title, description, blocks").eq("slug", slug).eq("status", "active").maybeSingle();
  if (!data) return null;
  const parsed = blocksSchema.safeParse(data.blocks);
  return { slug: data.slug as string, title: data.title as string, description: (data.description as string) ?? "", blocks: (parsed.success ? parsed.data : []) as Block[] };
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) return {};
  return { title: p.title, description: p.description || undefined, alternates: { canonical: `${SITE_URL}/p/${p.slug}` } };
}

export default async function CustomPage({ params }: Params) {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) {
    const to = await findRedirect(`/p/${slug}`);
    if (to) permanentRedirect(to);
    notFound();
  }
  const { products, categories } = await getCatalog();

  const faqs = p.blocks.flatMap((b) => (b.type === "faq" ? b.items.filter((i) => i.q && i.a) : []));
  const graph: object[] = [{ "@type": "WebPage", name: p.title, url: `${SITE_URL}/p/${p.slug}`, ...(p.description ? { description: p.description } : {}) }];
  if (faqs.length) graph.push({ "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
  const ld = { "@context": "https://schema.org", "@graph": graph };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <main><BlockRenderer blocks={p.blocks} products={products} categories={categories} /></main>
    </>
  );
}
