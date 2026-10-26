"use client";

import Link from "next/link";
import type { Product } from "@/lib/demo-products";
import { useMounted, useWishlist } from "@/lib/lists";
import { ProductCard } from "./ProductCard";

export function WishlistView({ products }: { products: Product[] }) {
  const ids = useWishlist((s) => s.ids);
  const mounted = useMounted();
  const list = products.filter((p) => ids.includes(p.id));
  if (!mounted) return null;
  if (list.length === 0) return <p className="mt-8 text-sm text-muted">Nothing saved yet. Tap the heart on any product to keep it here. <Link href="/shop" className="underline">Browse the shop</Link>.</p>;
  return <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>;
}
