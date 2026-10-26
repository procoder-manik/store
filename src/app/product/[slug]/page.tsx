import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog, getProduct } from "@/lib/catalog";
import { SITE_URL } from "@/lib/config";
import { getPublicSettings } from "@/lib/settings";
import { ProductDetail } from "@/components/ProductDetail";
import { ReviewsSection } from "@/components/ReviewsSection";
import { getReviews } from "@/lib/reviews";
import { getBundles } from "@/lib/bundles";
import { BundleBox } from "@/components/BundleBox";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  const title = p.seo?.title || p.name;
  const description = p.seo?.description || p.description.slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/product/${p.slug}` },
    openGraph: { title, description, type: "website", images: p.image ? [p.image] : undefined },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();

  const { products } = await getCatalog();
  const same = products.filter((x) => x.id !== p.id && x.category === p.category);
  const pairs = (products.find((x) => x.id === p.id)?.related ?? []).map((id) => products.find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => !!x);
  const { avg, count } = await getReviews(p.id);
  const { brand, contact } = await getPublicSettings();
  const mine = (await getBundles()).find((b) => b.productIds.includes(p.id));
  const bundleProducts = mine ? mine.productIds.map((id) => products.find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => !!x) : [];
  const related = [...same, ...products.filter((x) => x.id !== p.id && x.category !== p.category)].slice(0, 4);
  const url = `${SITE_URL}/product/${p.slug}`;
  const inStock = (p.variants?.length ?? 0) === 0 || p.variants!.some((v) => v.stock > 0);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: p.name,
        description: p.description,
        image: (p.images ?? []).map((i) => i.url),
        brand: { "@type": "Brand", name: brand.name },
        ...(count > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: count } } : {}),
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: "BDT",
          price: String(p.basePrice),
          availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: p.name, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <ProductDetail product={p} related={related} pairs={pairs} reviews={<ReviewsSection productId={p.id} slug={p.slug} />} whatsapp={contact.whatsapp} bundle={mine && bundleProducts.length === mine.productIds.length ? <BundleBox name={mine.name} percent={mine.percent} products={bundleProducts} /> : undefined} />
    </>
  );
}
