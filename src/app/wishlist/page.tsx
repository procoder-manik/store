import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { WishlistView } from "@/components/WishlistView";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };
export const revalidate = 60;

export default async function Wishlist() {
  const { products } = await getCatalog();
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 md:py-12">
      <h1 className="font-display text-3xl font-semibold md:text-4xl">Wishlist</h1>
      <WishlistView products={products} />
    </main>
  );
}
