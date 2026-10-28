import { ProductHero } from "@/components/ProductHero";
import { Storefront } from "@/components/Storefront";
import { HomeSections } from "@/components/HomeSections";
import { getCatalog } from "@/lib/catalog";
import { getBanners } from "@/lib/banners";
import { getPublicSettings } from "@/lib/settings";
import { BlockRenderer } from "@/components/Blocks";
import { blocksSchema, type Block } from "@/lib/blocks";
import { createPublicClient } from "@/lib/supabase/public";
import { SITE_URL } from "@/lib/config";

export const revalidate = 60;

export default async function Home() {
  const [{ products, categories }, banners] = await Promise.all([getCatalog(), getBanners()]);
  const { brand, contact } = await getPublicSettings();
  const sb = createPublicClient();
  const saved = sb ? (await sb.from("pages").select("blocks").eq("slug", "home").eq("status", "active").maybeSingle()).data : null;
  const parsed = saved ? blocksSchema.safeParse(saved.blocks) : null;
  const blocks: Block[] = parsed?.success ? parsed.data : [];
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${SITE_URL}/#org`, name: brand.name, url: SITE_URL, ...(contact.phone || contact.email ? { contactPoint: { "@type": "ContactPoint", contactType: "customer service", areaServed: "BD", ...(contact.phone ? { telephone: `+88${contact.phone}` } : {}), ...(contact.email ? { email: contact.email } : {}) } } : {}) },
      { "@type": "WebSite", "@id": `${SITE_URL}/#site`, url: SITE_URL, name: brand.name, publisher: { "@id": `${SITE_URL}/#org` }, potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/shop?q={search_term_string}`, "query-input": "required name=search_term_string" } },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      {blocks.length > 0 ? (
        <BlockRenderer blocks={blocks} products={products} categories={categories} banners={banners} />
      ) : (
        <>
          <ProductHero products={products} categories={categories} eyebrow="New season" heading="Stand out without trying" sub="Clothing, bedding and home decor made to last, delivered across Bangladesh. Pay in cash when it arrives." button="Get the look" tagline="Comfort, wrapped in good design" autoplay={5} />
          <Storefront products={products} categories={categories} heading="Browse the rail." sub="Drag to explore, then tap anything to see it up close." level="h2" />
          <HomeSections products={products} categories={categories} banners={banners} />
        </>
      )}
    </>
  );
}
