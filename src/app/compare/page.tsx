import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { CompareView } from "@/components/CompareView";

export const metadata: Metadata = { title: "Compare products", robots: { index: false } };
export const revalidate = 60;

export default async function Compare() {
  const { products } = await getCatalog();
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 md:py-12">
      <h1 className="font-display text-3xl font-semibold md:text-4xl">Compare</h1>
      <CompareView products={products} />
    </main>
  );
}
