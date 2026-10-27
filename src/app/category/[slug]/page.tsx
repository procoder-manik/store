import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { getCatalog } from "@/lib/catalog";
import { SITE_URL } from "@/lib/config";
import { findRedirect } from "@/lib/redirects";
import { getPublicSettings } from "@/lib/settings";
import { ShopGrid } from "@/components/ShopGrid";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const { products, categories } = await getCatalog();
  const cat = categories.find((c) => c.id === slug);
  if (!cat) {
    const to = await findRedirect(`/category/${slug}`);
    if (to) permanentRedirect(to);
    return null;
  }
  return { cat, categories, list: products.filter((p) => p.category === slug) };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { products, categories } = await getCatalog();
  const cat = categories.find((c) => c.id === slug);
  if (!cat) return {};
  const { brand } = await getPublicSettings();
  const count = products.filter((p) => p.category === slug).length;
  const description = cat.description || `Shop ${cat.label.toLowerCase()} at ${brand.name}. ${count} ${count === 1 ? "product" : "products"} with cash on delivery across Bangladesh.`;
  const image = products.find((p) => p.category === slug && p.image)?.image;
  return {
    title: cat.label,
    description,
    alternates: { canonical: `${SITE_URL}/category/${slug}` },
    openGraph: { title: cat.label, description, url: `${SITE_URL}/category/${slug}`, ...(image ? { images: [image] } : {}) },
  };
}

export default async function Category({ params }: Params) {
  const { slug } = await params;
  const r = await load(slug);
  if (!r) notFound();
  const url = `${SITE_URL}/category/${slug}`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: r.cat.label, url, ...(r.cat.description ? { description: r.cat.description } : {}) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
        { "@type": "ListItem", position: 3, name: r.cat.label, item: url },
      ] },
      { "@type": "ItemList", itemListElement: r.list.slice(0, 30).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/product/${p.slug}`, name: p.name })) },
    ],
  };
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <Suspense><ShopGrid products={r.list} categories={r.categories} active={slug} title={r.cat.label} intro={r.cat.description} /></Suspense>
    </main>
  );
}
