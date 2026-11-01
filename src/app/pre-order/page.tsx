import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

export const metadata: Metadata = { title: "Pre-order", description: "Reserve upcoming products before they launch, at a special pre-order price.", alternates: { canonical: "/pre-order" } };
export const revalidate = 60;

const STEPS = ["Choose a product and reserve it at the pre-order price.", "Pay the advance shown at checkout. We check it and confirm your order.", "When the product arrives we deliver it, and you pay the rest."];

export default async function PreOrder() {
  const { products } = await getCatalog();
  const list = products.filter((p) => p.preorder);
  return (
    <main className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-16">
      <h1 className="font-display text-[clamp(2.5rem,1.6rem+4vw,5rem)] font-normal leading-[1.02]">Pre-order</h1>
      <p className="mt-4 max-w-xl text-muted">New products on their way. Reserve yours now for less than the price after launch.</p>
      <ol className="mt-8 grid gap-4 border-y border-line py-6 md:grid-cols-3">
        {STEPS.map((s, i) => <li key={s} className="flex items-start gap-3 text-sm"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-ink">{i + 1}</span><span className="pt-1">{s}</span></li>)}
      </ol>
      {list.length === 0 ? (
        <div className="grid place-items-center gap-4 py-20 text-center">
          <p className="text-muted">Nothing is open for pre-order right now.</p>
          <Link href="/shop" className="rounded-pill bg-accent px-6 py-3 text-sm font-semibold text-accent-ink">Browse the shop</Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-6 md:gap-y-14">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      )}
    </main>
  );
}
