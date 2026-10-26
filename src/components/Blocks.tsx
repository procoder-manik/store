import Link from "next/link";
import type { Product } from "@/lib/demo-products";
import type { Cat } from "@/lib/catalog";
import type { Block } from "@/lib/blocks";
import { ProductCard } from "./ProductCard";
import { ProductArt } from "./ProductArt";

const wrap = "mx-auto max-w-6xl px-5 py-8 md:py-10";
const btn = "mt-5 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-ink";

function Btn({ text, href }: { text: string; href: string }) {
  if (!text || !href) return null;
  return <Link href={href} className={btn}>{text}</Link>;
}

function Paras({ text }: { text: string }) {
  return <>{text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p, i) => <p key={i} className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted first:mt-0 md:text-base">{p}</p>)}</>;
}

export function BlockView({ b, products, categories }: { b: Block; products: Product[]; categories: Cat[] }) {
  switch (b.type) {
    case "hero":
      return (
        <section className={wrap}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent to-ink">
            {b.image && <img src={b.image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
            <div className={`relative flex min-h-[320px] flex-col justify-center p-8 text-white md:min-h-[420px] md:p-14 ${b.align === "center" ? "items-center text-center" : ""}`}>
              <h1 className="max-w-2xl font-display text-4xl font-semibold leading-tight md:text-6xl">{b.heading}</h1>
              {b.sub && <p className="mt-4 max-w-xl text-base opacity-90 md:text-lg">{b.sub}</p>}
              {b.button && b.link && <Link href={b.link} className="mt-6 w-fit rounded-full bg-white px-6 py-3 text-sm font-semibold text-black">{b.button}</Link>}
            </div>
          </div>
        </section>
      );
    case "text":
      return (
        <section className={wrap}>
          <div className="max-w-3xl">
            {b.heading && <h2 className="mb-4 font-display text-2xl font-semibold md:text-3xl">{b.heading}</h2>}
            <Paras text={b.body} />
          </div>
        </section>
      );
    case "products": {
      const list = (b.source === "category" ? products.filter((p) => p.category === b.category) : b.source === "tag" ? products.filter((p) => p.tags.includes(b.tag)) : products).slice(0, b.count);
      return (
        <section className={wrap}>
          {b.title && <h2 className="mb-6 font-display text-2xl font-semibold md:text-3xl">{b.title}</h2>}
          {list.length === 0 ? <p className="text-sm text-muted">No products match yet.</p> : <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
        </section>
      );
    }
    case "categories":
      return (
        <section className={wrap}>
          {b.title && <h2 className="mb-6 font-display text-2xl font-semibold md:text-3xl">{b.title}</h2>}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {categories.map((c) => {
              const first = products.find((p) => p.category === c.id);
              return (
                <Link key={c.id} href={`/shop?cat=${c.id}`} className="group relative block overflow-hidden rounded-2xl border border-line bg-surface">
                  {first?.image ? <img src={first.image} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover" /> : first ? <ProductArt kind={first.kind} color={first.colors[0].hex} className="aspect-[4/5] w-full" /> : <div className="aspect-[4/5]" />}
                  <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-10 text-sm font-medium text-white">{c.label}</p>
                </Link>
              );
            })}
          </div>
        </section>
      );
    case "banner": {
      const inner = (
        <>
          {b.image ? <img src={b.image} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 bg-gradient-to-br from-accent to-ink" />}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
          <div className="relative flex h-full flex-col justify-end p-6 text-white md:p-10">
            <p className="font-display text-2xl font-semibold md:text-4xl">{b.title}</p>
            {b.sub && <p className="mt-1 max-w-md text-sm opacity-90">{b.sub}</p>}
            {b.button && <span className="mt-4 w-fit rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">{b.button}</span>}
          </div>
        </>
      );
      const cls = "relative block aspect-[16/9] overflow-hidden rounded-3xl md:aspect-[21/8]";
      return <section className={wrap}>{b.link ? <Link href={b.link} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>}</section>;
    }
    case "features":
      return (
        <section className={wrap}>
          {b.title && <h2 className="mb-6 font-display text-2xl font-semibold md:text-3xl">{b.title}</h2>}
          <div className="grid gap-4 md:grid-cols-3">{b.items.map((f, i) => <div key={i} className="rounded-2xl border border-line bg-surface p-6"><p className="font-medium">{f.title}</p><p className="mt-1 text-sm text-muted">{f.text}</p></div>)}</div>
        </section>
      );
    case "faq":
      return (
        <section className={wrap}>
          {b.title && <h2 className="mb-6 font-display text-2xl font-semibold md:text-3xl">{b.title}</h2>}
          <div className="max-w-3xl divide-y divide-line rounded-2xl border border-line bg-surface">
            {b.items.map((f, i) => <details key={i} className="group p-5"><summary className="cursor-pointer list-none font-medium">{f.q}</summary><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{f.a}</p></details>)}
          </div>
        </section>
      );
    case "image": {
      if (!b.image) return <section className={wrap}><div className="grid aspect-[16/7] place-items-center rounded-3xl border border-dashed border-line text-sm text-muted">Add an image link</div></section>;
      const img = <img src={b.image} alt={b.caption} loading="lazy" className="w-full rounded-3xl border border-line object-cover" />;
      return <section className={wrap}>{b.link ? <Link href={b.link}>{img}</Link> : img}{b.caption && <p className="mt-2 text-center text-sm text-muted">{b.caption}</p>}</section>;
    }
    case "cta":
      return (
        <section className={wrap}>
          <div className="rounded-3xl bg-ink p-8 text-center text-paper md:p-14">
            <h2 className="font-display text-3xl font-semibold md:text-4xl">{b.heading}</h2>
            {b.text && <p className="mx-auto mt-3 max-w-xl opacity-80">{b.text}</p>}
            {b.button && b.link && <Link href={b.link} className="mt-6 inline-block rounded-full bg-accent px-7 py-3 text-sm font-semibold text-accent-ink">{b.button}</Link>}
          </div>
        </section>
      );
  }
}

export function BlockRenderer({ blocks, products, categories }: { blocks: Block[]; products: Product[]; categories: Cat[] }) {
  return <>{blocks.map((b) => <BlockView key={b.id} b={b} products={products} categories={categories} />)}</>;
}
