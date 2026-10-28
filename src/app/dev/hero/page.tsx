import { notFound } from "next/navigation";
import { ProductHero } from "@/components/ProductHero";
import { getCatalog } from "@/lib/catalog";

/** Local preview of the product showcase hero. Not available in production. */
export default async function HeroPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  const { products, categories } = await getCatalog();
  return (
    <div data-theme="studio" className="min-h-dvh bg-paper py-6 text-ink">
      <ProductHero products={products} categories={categories} eyebrow="New season" heading="Stand out without trying" sub="It is not just about staying warm. It is about stepping outside and instantly feeling confident, comfortable and completely yourself." button="Get the look" tagline="Confidence, wrapped in warmth" social={{ instagram: "https://instagram.com", facebook: "https://facebook.com", youtube: "https://youtube.com" }} autoplay={0} />
    </div>
  );
}
