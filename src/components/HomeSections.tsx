import Link from "next/link";
import type { Product } from "@/lib/demo-products";
import type { Cat } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";
import { ProductArt } from "./ProductArt";
import type { Banner } from "@/lib/banners";
import { Reveal } from "./Reveal";

export function HomeSections({ products, categories, banners = [] }: { products: Product[]; categories: Cat[]; banners?: Banner[] }) {
  const popular = products.filter((p) => p.tags.includes("hot")).slice(0, 4);
  const fresh = (products.filter((p) => p.tags.includes("new")).length >= 4 ? products.filter((p) => p.tags.includes("new")) : products).slice(0, 4);
  return (
    <div className="mx-auto max-w-6xl px-5">
      {banners.length > 0 && (
        <section aria-label="Offers" className="flex snap-x snap-mandatory gap-4 no-scrollbar overflow-x-auto pt-10 pb-2">
          {banners.map((b) => {
            const inner = (
              <>
                {b.image ? <img src={b.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 bg-gradient-to-br from-accent to-ink" />}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
                <div className="relative flex h-full flex-col justify-end p-6 text-white md:p-8">
                  <p className="font-display text-2xl font-semibold leading-tight md:text-3xl">{b.title}</p>
                  {b.subtitle && <p className="mt-1 max-w-sm text-sm opacity-90">{b.subtitle}</p>}
                  {b.button && <span className="mt-4 w-fit rounded-pill bg-white px-5 py-2 text-sm font-semibold text-black">{b.button}</span>}
                </div>
              </>
            );
            const cls = `relative block aspect-[16/9] shrink-0 snap-start overflow-hidden rounded-3xl md:aspect-[21/8] ${banners.length === 1 ? "w-full" : "w-[88%] md:w-[calc(50%-0.5rem)]"}`;
            return b.link ? <Link key={b.id} href={b.link} className={cls}>{inner}</Link> : <div key={b.id} className={cls}>{inner}</div>;
          })}
        </section>
      )}
      {categories.length > 0 && (
        <Reveal><section className="pt-16">
          <h2 className="font-display text-2xl font-semibold md:text-3xl">Shop by category</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
            {categories.map((c) => {
              const items = products.filter((p) => p.category === c.id);
              const first = items[0];
              return (
                <Link key={c.id} href={`/category/${c.id}`} className="group relative block overflow-hidden rounded-2xl border border-line bg-surface">
                  {first?.image ? <img src={first.image} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105" /> : first ? <ProductArt kind={first.kind} color={first.colors[0].hex} className="aspect-[4/5] w-full transition duration-500 group-hover:scale-105" /> : <div className="aspect-[4/5]" />}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12 text-white">
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className="text-xs opacity-80">{items.length} {items.length === 1 ? "item" : "items"}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section></Reveal>
      )}

      {popular.length >= 2 && (
        <Reveal><section className="pt-16">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold md:text-3xl">Popular right now</h2>
            <Link href="/shop?tag=hot" className="text-sm text-muted underline hover:text-ink">See more</Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4">{popular.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </section></Reveal>
      )}

      {fresh.length > 0 && (
        <Reveal><section className="pt-16">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold md:text-3xl">Just in</h2>
            <Link href="/shop" className="text-sm text-muted underline hover:text-ink">See all products</Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4">{fresh.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </section></Reveal>
      )}

    </div>
  );
}
