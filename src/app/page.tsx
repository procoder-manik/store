import { Storefront } from "@/components/Storefront";
import { HomeSections } from "@/components/HomeSections";
import { getCatalog } from "@/lib/catalog";
import { getBanners } from "@/lib/banners";

export const revalidate = 60;

export default async function Home() {
  const [{ products, categories }, banners] = await Promise.all([getCatalog(), getBanners()]);
  return (
    <>
      <Storefront products={products} categories={categories} />
      <HomeSections products={products} categories={categories} banners={banners} />
    </>
  );
}
