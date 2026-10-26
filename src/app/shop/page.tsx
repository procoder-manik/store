import type { Metadata } from "next";
import { Suspense } from "react";
import { getCatalog } from "@/lib/catalog";
import { ShopGrid } from "@/components/ShopGrid";

export const metadata: Metadata = { title: "Shop", description: "Browse clothing, bedding and home decor." };
export const revalidate = 60;

export default async function Shop() {
  const { products, categories } = await getCatalog();
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 md:py-12">
      <Suspense><ShopGrid products={products} categories={categories} /></Suspense>
    </main>
  );
}
