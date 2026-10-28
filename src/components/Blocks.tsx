import Link from "next/link";
import type { Product } from "@/lib/demo-products";
import type { Cat } from "@/lib/catalog";
import type { Banner } from "@/lib/banners";
import type { Block } from "@/lib/blocks";
import { formatPrice } from "@/lib/config";
import { Clock, CreditCard, Gift, Headset, RefreshCcw, ShieldCheck, Star, Truck } from "lucide-react";
import { HtmlBlock } from "./HtmlBlock";
import { Countdown } from "./Countdown";
import { CountUp } from "./CountUp";
import { Heading } from "./Heading";
import { NewsletterForm } from "./NewsletterForm";
import { Reveal } from "./Reveal";
import { OrderBlock, type Zone } from "./OrderBlock";
import { ProductArt } from "./ProductArt";
import { ProductCard } from "./ProductCard";
import { ProductHero } from "./ProductHero";
import { Rich } from "./Rich";
import { SliderBlock } from "./SliderBlock";
import { Storefront } from "./Storefront";

const wrap = "mx-auto max-w-6xl px-5 py-8 md:py-10";
const btn = "rounded-pill bg-white px-6 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5";

export type BlockCtx = { products: Product[]; categories: Cat[]; banners?: Banner[]; zones?: Zone[]; slug?: string; preview?: boolean };

function pick(products: Product[], source: "all" | "category" | "tag", category: string, tag: Product["tags"][number]) {
  return source === "category" ? products.filter((p) => p.category === category) : source === "tag" ? products.filter((p) => p.tags.includes(tag)) : products;
}

export function BlockView({ b, ctx }: { b: Block; ctx: BlockCtx }) {
  const { products, categories } = ctx;
  switch (b.type) {
    case "hero":
    case "herofull": {
      if (b.variant === "aurora") {
        return (
          <section className={wrap}>
            <div className="relative isolate overflow-hidden rounded-3xl bg-ink text-white">
              <div aria-hidden className="absolute inset-0 -z-10">
                <div className="animate-aurora-a absolute -left-24 -top-28 h-[26rem] w-[26rem] rounded-full bg-accent opacity-80 blur-3xl" />
                <div style={{ background: "color-mix(in srgb, var(--accent) 45%, white)" }} className="animate-aurora-b absolute -bottom-36 right-[-4rem] h-[30rem] w-[30rem] rounded-full opacity-50 blur-3xl" />
                <div className="animate-aurora-a absolute left-1/2 top-1/3 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
              </div>
              {b.image && <img src={b.image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30 mix-blend-overlay" />}
              <div className="mx-auto flex min-h-[380px] max-w-3xl flex-col items-center justify-center gap-5 p-8 text-center md:min-h-[520px] md:p-14">
                <Heading as={b.level} className="font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-7xl">{b.heading}</Heading>
                {b.sub && <p className="max-w-xl text-base opacity-85 md:text-xl">{b.sub}</p>}
                {b.button && b.link && <Link href={b.link} className="shine rounded-pill bg-white px-8 py-4 text-sm font-semibold text-black transition hover:-translate-y-0.5">{b.button}</Link>}
              </div>
            </div>
          </section>
        );
      }
      if (b.variant === "bold") {
        return (
          <section className={wrap}>
            <div data-bleed="both" className="relative overflow-hidden rounded-3xl border border-line bg-surface px-6 py-12 md:px-14 md:py-20">
              <div aria-hidden className="animate-floaty absolute -right-10 -top-10 h-56 w-56 rounded-full bg-accent opacity-90 md:h-80 md:w-80" />
              <div aria-hidden className="animate-floaty absolute bottom-6 right-24 h-16 w-16 rounded-full border-4 border-ink md:h-24 md:w-24" style={{ animationDelay: "-3s" }} />
              <div className="relative max-w-4xl">
                <Heading as={b.level} className="font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-8xl">{b.heading}</Heading>
                {b.sub && <p className="mt-6 max-w-lg text-lg text-muted md:text-xl">{b.sub}</p>}
                {b.button && b.link && <Link href={b.link} className="shine mt-8 inline-flex items-center gap-2 rounded-pill bg-ink px-8 py-4 text-base font-semibold text-paper transition hover:-translate-y-0.5">{b.button} <span aria-hidden>&rarr;</span></Link>}
              </div>
            </div>
          </section>
        );
      }
      if (b.variant === "split") {
        return (
          <section className={wrap}>
            <div className="grid items-center gap-8 overflow-hidden rounded-3xl border border-line bg-surface md:grid-cols-2">
              <div data-bleed="left" className="p-8 md:p-14">
                <Heading as={b.level} className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-6xl">{b.heading}</Heading>
                {b.sub && <p className="mt-4 max-w-md text-base text-muted md:text-lg">{b.sub}</p>}
                {b.button && b.link && <Link href={b.link} className="mt-7 inline-block rounded-pill bg-accent px-7 py-3.5 text-sm font-semibold text-accent-ink transition hover:-translate-y-0.5">{b.button}</Link>}
              </div>
              <div className="relative min-h-[260px] self-stretch bg-gradient-to-br from-accent/25 to-paper md:min-h-[420px]">
                {b.image ? <img src={b.image} alt="" className="absolute inset-0 h-full w-full object-cover" /> : products[0] && <ProductArt kind={products[0].kind} color={products[0].colors[0].hex} className="absolute inset-0 h-full w-full" />}
              </div>
            </div>
          </section>
        );
      }
      const center = b.variant === "center" || b.align === "center";
      return (
        <section className={wrap}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent to-ink">
            {b.image && <img src={b.image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
            <div className={`absolute inset-0 ${center ? "bg-black/45" : "bg-gradient-to-r from-black/60 via-black/25 to-transparent"}`} />
            <div data-bleed="both" className={`relative flex min-h-[320px] flex-col justify-center p-8 text-white md:min-h-[440px] md:p-14 ${center ? "items-center text-center" : ""}`}>
              <Heading as={b.level} className="max-w-3xl font-display text-4xl font-semibold leading-tight md:text-6xl">{b.heading}</Heading>
              {b.sub && <p className="mt-4 max-w-xl text-base opacity-90 md:text-lg">{b.sub}</p>}
              {b.button && b.link && <Link href={b.link} className={`${btn} mt-7 w-fit`}>{b.button}</Link>}
            </div>
          </div>
        </section>
      );
    }
    case "showcase":
    case "showcasefull": {
      const list = pick(products, b.source, b.category, b.tag);
      return <ProductHero products={list.length ? list : products} categories={categories} eyebrow={b.eyebrow} heading={b.heading} sub={b.sub} button={b.button} tagline={b.tagline} level={b.level} full={b.type === "showcasefull"} autoplay={b.autoplay} fit={b.fit} showNav={b.showNav} social={{ facebook: b.facebook, instagram: b.instagram, youtube: b.youtube, whatsapp: b.whatsapp }} />;
    }
    case "rail3d":
    case "rail3dfull": {
      const list = pick(products, b.source, b.category, b.tag);
      return <Storefront products={list.length ? list : products} categories={categories} variant={b.style} showHero={b.showHero} heading={b.heading} sub={b.sub || undefined} button={b.button} link={b.link} button2={b.button2} link2={b.link2} defaultView={b.defaultView} level={b.level} full={b.type === "rail3dfull"} arrows={b.arrows} pills={b.pills} headAlign={b.headAlign} textBg={b.textBg} textBgColor={b.textBgColor} />;
    }
    case "slider":
    case "sliderfull":
      return <SliderBlock slides={b.slides} style={b.style} level={b.level} />;
    case "spotlight": {
      const p = products.find((x) => x.id === b.productId) ?? products[0];
      if (!p) return null;
      return (
        <section className={wrap}>
          <div className="grid items-center gap-8 rounded-3xl border border-line bg-surface p-6 md:grid-cols-2 md:p-10">
            <div className="overflow-hidden rounded-2xl border border-line">{p.image ? <img src={p.image} alt={p.name} className="aspect-[4/5] w-full object-cover" /> : <ProductArt kind={p.kind} color={p.colors[0].hex} className="aspect-[4/5] w-full" />}</div>
            <div>
              {b.heading && <p className="text-sm font-medium text-accent">{b.heading}</p>}
              <Heading as={b.level} className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-5xl">{p.name}</Heading>
              <p className="mt-3 text-2xl font-semibold">{formatPrice(p.basePrice)}{p.compareAt && p.compareAt > p.basePrice && <span className="ml-3 text-base font-normal text-muted line-through">{formatPrice(p.compareAt)}</span>}</p>
              <p className="mt-4 line-clamp-4 max-w-md text-muted">{p.description.split("\n")[0]}</p>
              {p.hasColors !== false && <div className="mt-5 flex gap-2">{p.colors.map((c) => <span key={c.name} title={c.name} style={{ background: c.hex }} className="h-7 w-7 rounded-full border border-line" />)}</div>}
              <Link href={`/product/${p.slug}`} className="mt-7 inline-block rounded-pill bg-accent px-7 py-3.5 text-sm font-semibold text-accent-ink transition hover:-translate-y-0.5">{b.button || "View product"}</Link>
            </div>
          </div>
        </section>
      );
    }
    case "pagehead":
      return (
        <div className="relative overflow-hidden border-b border-line bg-gradient-to-br from-accent/10 via-surface to-surface">
          <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-5 py-10 md:py-14">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted"><Link href="/" className="hover:text-ink">Home</Link><span aria-hidden>/</span><span className="text-ink">{b.title}</span></nav>
            <Heading as={b.level} className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-5xl">{b.title}</Heading>
            <span aria-hidden className="mt-4 block h-1 w-14 rounded-full bg-accent" />
            {b.intro && <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">{b.intro}</p>}
          </div>
        </div>
      );
    case "text":
      return (
        <section className={wrap}>
          <div className="max-w-3xl">
            {b.heading && <Heading as={b.level} className="mb-4 font-display text-2xl font-semibold md:text-3xl">{b.heading}</Heading>}
            <div className="grid gap-3 text-[15px] leading-relaxed text-muted md:text-base"><Rich text={b.body} /></div>
          </div>
        </section>
      );
    case "richtext": {
      const btn2 = "inline-block rounded-pill px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5";
      return (
        <section className={wrap}>
          <div className={`grid gap-4 ${b.width === "narrow" ? "max-w-3xl" : ""}`}>
            {b.parts.map((x, i) => {
              if (x.t === "heading") return <Heading key={i} as={x.level} className={`font-display font-semibold tracking-tight ${x.level === "h1" ? "text-4xl md:text-5xl" : x.level === "h2" ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"} ${i > 0 ? "mt-4" : ""}`}>{x.text}</Heading>;
              if (x.t === "paragraph") return <p key={i} className="text-[15px] leading-relaxed text-muted md:text-base">{x.text}</p>;
              if (x.t === "list") return <ul key={i} className="grid gap-2 pl-5 text-[15px] leading-relaxed text-muted [&>li]:list-disc">{x.items.map((l, k) => <li key={k}>{l}</li>)}</ul>;
              if (x.t === "quote") return <blockquote key={i} className="border-l-4 border-accent pl-5 text-lg italic leading-relaxed">{x.text}{x.by && <footer className="mt-2 text-sm not-italic text-muted">{x.by}</footer>}</blockquote>;
              if (x.t === "divider") return <hr key={i} className="my-2 border-line" />;
              if (!x.href) return null;
              return <p key={i}><Link href={x.href} className={x.style === "button" ? `${btn2} bg-accent text-accent-ink` : x.style === "outline" ? `${btn2} border border-line` : "font-medium text-accent underline underline-offset-4"}>{x.text}</Link></p>;
            })}
          </div>
        </section>
      );
    }
    case "products": {
      const list = pick(products, b.source, b.category, b.tag).slice(0, b.count);
      return (
        <section className={wrap}>
          {b.title && <Heading as={b.level} className="mb-6 font-display text-2xl font-semibold md:text-3xl">{b.title}</Heading>}
          {list.length === 0 ? <p className="text-sm text-muted">No products match yet.</p> : <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
        </section>
      );
    }
    case "categories":
      return (
        <section className={wrap}>
          {b.title && <Heading as={b.level} className="mb-6 font-display text-2xl font-semibold md:text-3xl">{b.title}</Heading>}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {categories.map((c) => {
              const first = products.find((p) => p.category === c.id);
              const n = products.filter((p) => p.category === c.id).length;
              return (
                <Link key={c.id} href={`/category/${c.id}`} className="group relative block overflow-hidden rounded-2xl border border-line bg-surface">
                  {first?.image ? <img src={first.image} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105" /> : first ? <ProductArt kind={first.kind} color={first.colors[0].hex} className="aspect-[4/5] w-full transition duration-500 group-hover:scale-105" /> : <div className="aspect-[4/5]" />}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12 text-white"><p className="text-sm font-medium">{c.label}</p><p className="text-xs opacity-80">{n} {n === 1 ? "item" : "items"}</p></div>
                </Link>
              );
            })}
          </div>
        </section>
      );
    case "banners": {
      const banners = ctx.banners ?? [];
      if (!banners.length) return null;
      return (
        <section className={wrap}>
          {b.title && <Heading as={b.level} className="mb-6 font-display text-2xl font-semibold md:text-3xl">{b.title}</Heading>}
          <div className="flex snap-x snap-mandatory gap-4 no-scrollbar overflow-x-auto pb-2">
            {banners.map((x) => {
              const inner = (
                <>
                  {x.image ? <img src={x.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 bg-gradient-to-br from-accent to-ink" />}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
                  <div className="relative flex h-full flex-col justify-end p-6 text-white md:p-8"><p className="font-display text-2xl font-semibold leading-tight md:text-3xl">{x.title}</p>{x.subtitle && <p className="mt-1 max-w-sm text-sm opacity-90">{x.subtitle}</p>}{x.button && <span className={`${btn} mt-4 w-fit !py-2 !text-sm`}>{x.button}</span>}</div>
                </>
              );
              const cls = `relative block aspect-[16/9] shrink-0 snap-start overflow-hidden rounded-3xl md:aspect-[21/8] ${banners.length === 1 ? "w-full" : "w-[88%] md:w-[calc(50%-0.5rem)]"}`;
              return x.link ? <Link key={x.id} href={x.link} className={cls}>{inner}</Link> : <div key={x.id} className={cls}>{inner}</div>;
            })}
          </div>
        </section>
      );
    }
    case "banner":
    case "bannerfull": {
      const inner = (
        <>
          {b.image ? <img src={b.image} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 bg-gradient-to-br from-accent to-ink" />}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
          <div data-bleed="both" className="relative flex h-full flex-col justify-end p-6 text-white md:p-10"><p className="font-display text-2xl font-semibold md:text-4xl">{b.title}</p>{b.sub && <p className="mt-1 max-w-md text-sm opacity-90">{b.sub}</p>}{b.button && <span className={`${btn} mt-4 w-fit !py-2`}>{b.button}</span>}</div>
        </>
      );
      const cls = "relative block aspect-[16/9] overflow-hidden rounded-3xl md:aspect-[21/8]";
      return <section className={wrap}>{b.link ? <Link href={b.link} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>}</section>;
    }
    case "features":
      return (
        <section className={wrap}>
          {b.title && <Heading as={b.level} className="mb-6 font-display text-2xl font-semibold md:text-3xl">{b.title}</Heading>}
          <div className="grid gap-4 md:grid-cols-3">{b.items.map((f, i) => <div key={i} className="lift rounded-2xl border border-line bg-surface p-6"><p className="font-medium">{f.title}</p><p className="mt-1 text-sm text-muted">{f.text}</p></div>)}</div>
        </section>
      );
    case "faq":
      return (
        <section className={wrap}>
          {b.title && <Heading as={b.level} className="mb-6 font-display text-2xl font-semibold md:text-3xl">{b.title}</Heading>}
          <div className="max-w-3xl divide-y divide-line rounded-2xl border border-line bg-surface">
            {b.items.map((f, i) => <details key={i} className="group p-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">{f.q}<span className="text-xl text-muted transition group-open:rotate-45" aria-hidden>+</span></summary><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{f.a}</p></details>)}
          </div>
        </section>
      );
    case "image": {
      if (!b.image) return <section className={wrap}><div className="grid aspect-[16/7] place-items-center rounded-3xl border border-dashed border-line text-sm text-muted">Add an image link</div></section>;
      const img = <img src={b.image} alt={b.caption} loading="lazy" className="w-full rounded-3xl border border-line object-cover" />;
      return <section className={wrap}>{b.link ? <Link href={b.link}>{img}</Link> : img}{b.caption && <p className="mt-2 text-center text-sm text-muted">{b.caption}</p>}</section>;
    }
    case "newsletter":
      return (
        <section className={wrap}>
          <div className="rounded-3xl border border-line bg-surface p-8 text-center md:p-12">
            <Heading as={b.level} className="font-display text-2xl font-semibold md:text-3xl">{b.title}</Heading>
            {b.text && <p className="mx-auto mt-2 max-w-md text-sm text-muted">{b.text}</p>}
            <div className="mx-auto mt-5 max-w-sm text-left"><NewsletterForm /></div>
          </div>
        </section>
      );
    case "cta":
      return (
        <section className={wrap}>
          <div className="relative isolate overflow-hidden rounded-3xl bg-ink px-6 py-12 text-center text-white md:px-14 md:py-16">
            <div aria-hidden className="animate-aurora-a absolute -left-16 -top-20 -z-10 h-72 w-72 rounded-full bg-accent opacity-60 blur-3xl" />
            <div aria-hidden className="animate-aurora-b absolute -bottom-24 -right-10 -z-10 h-80 w-80 rounded-full bg-accent opacity-40 blur-3xl" />
            <Heading as={b.level} className="font-display text-3xl font-semibold md:text-5xl">{b.heading}</Heading>
            {b.text && <p className="mx-auto mt-3 max-w-xl opacity-80">{b.text}</p>}
            {b.button && b.link && <Link href={b.link} className="shine mt-8 inline-block rounded-pill bg-white px-8 py-3.5 text-sm font-semibold text-black transition hover:-translate-y-0.5">{b.button}</Link>}
          </div>
        </section>
      );
    case "split":
      return (
        <section className={wrap}>
          <div className={`grid items-center gap-8 md:grid-cols-2 md:gap-14 ${b.imageSide === "right" ? "md:[&>*:first-child]:order-2" : ""}`}>
            <div className="overflow-hidden rounded-3xl border border-line bg-surface">{b.image ? <img src={b.image} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" /> : <div className="aspect-[4/3] bg-gradient-to-br from-accent/25 to-paper" />}</div>
            <div>
              {b.heading && <Heading as={b.level} className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{b.heading}</Heading>}
              <div className="mt-4 grid gap-3 text-[15px] leading-relaxed text-muted md:text-base"><Rich text={b.body} /></div>
              {b.button && b.link && <Link href={b.link} className="mt-6 inline-block rounded-pill bg-accent px-7 py-3.5 text-sm font-semibold text-accent-ink transition hover:-translate-y-0.5">{b.button}</Link>}
            </div>
          </div>
        </section>
      );
    case "trust": {
      const ICONS = { truck: Truck, shield: ShieldCheck, refresh: RefreshCcw, headset: Headset, gift: Gift, card: CreditCard, clock: Clock, star: Star };
      return (
        <section className={wrap}>
          <ul className="grid gap-5 rounded-3xl border border-line bg-surface p-6 sm:grid-cols-2 lg:grid-cols-4">
            {b.items.map((x, i) => { const I = ICONS[x.icon]; return (
              <li key={i} className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent/10 text-accent"><I size={20} /></span><span><span className="block text-sm font-semibold">{x.title}</span><span className="text-sm text-muted">{x.text}</span></span></li>
            ); })}
          </ul>
        </section>
      );
    }
    case "html":
      return <HtmlBlock code={b.code} />;
    case "marquee": {
      const speed = { slow: "46s", normal: "28s", fast: "14s" }[b.speed];
      const look = { plain: "border-y border-line bg-surface text-ink", accent: "bg-accent text-accent-ink", dark: "bg-ink text-paper" }[b.look];
      const row = b.items.concat(b.items).concat(b.items.length < 4 ? b.items.concat(b.items) : []);
      return (
        <div aria-label={b.items.join(", ")} role="marquee" className={`overflow-hidden py-4 ${look}`}>
          <div style={{ "--marquee-speed": speed } as React.CSSProperties} className="animate-marquee flex w-max items-center">
            {[0, 1].map((k) => <div key={k} aria-hidden={k === 1} className="flex shrink-0 items-center">{row.map((t, i) => <span key={i} className="flex items-center whitespace-nowrap px-6 font-display text-lg font-semibold tracking-tight md:text-2xl">{t}<span aria-hidden className="ml-12 opacity-50">&#10022;</span></span>)}</div>)}
          </div>
        </div>
      );
    }
    case "stats":
      return (
        <section className={wrap}>
          {b.title && <Heading as={b.level} className="mb-8 text-center font-display text-2xl font-semibold md:text-3xl">{b.title}</Heading>}
          <div className={`grid grid-cols-2 gap-4 ${({ 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" } as Record<number, string>)[b.items.length]}`}>
            {b.items.map((x, i) => (
              <div key={i} className="lift rounded-3xl border border-line bg-surface p-6 text-center md:p-8">
                <p className="font-display text-4xl font-semibold tracking-tight text-accent md:text-6xl"><CountUp to={x.value} suffix={x.suffix} /></p>
                <p className="mt-2 text-sm text-muted md:text-base">{x.label}</p>
              </div>
            ))}
          </div>
        </section>
      );
    case "testimonials":
      return (
        <section className={wrap}>
          {b.title && <Heading as={b.level} className="mb-6 font-display text-2xl font-semibold md:text-3xl">{b.title}</Heading>}
          <div className="grid gap-4 md:grid-cols-3">
            {b.items.map((x, i) => (
              <figure key={i} className="lift flex flex-col justify-between rounded-3xl border border-line bg-surface p-6 md:p-7">
                <span aria-hidden className="font-display text-5xl leading-none text-accent">&ldquo;</span>
                <blockquote className="mt-1 text-[15px] leading-relaxed">{x.quote}</blockquote>
                <figcaption className="mt-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-ink">{(x.name || "?").slice(0, 1).toUpperCase()}</span><span className="text-sm"><span className="block font-medium">{x.name}</span><span className="text-muted">{x.role}</span></span></figcaption>
              </figure>
            ))}
          </div>
        </section>
      );
    case "countdown":
      return (
        <section className={wrap}>
          <div className="relative isolate overflow-hidden rounded-3xl bg-ink px-6 py-12 text-center text-white md:py-16">
            <div aria-hidden className="animate-aurora-a absolute -left-16 -top-20 -z-10 h-72 w-72 rounded-full bg-accent opacity-60 blur-3xl" />
            <div aria-hidden className="animate-aurora-b absolute -bottom-24 -right-10 -z-10 h-80 w-80 rounded-full bg-accent opacity-40 blur-3xl" />
            <Heading as={b.level} className="font-display text-3xl font-semibold md:text-5xl">{b.title}</Heading>
            {b.text && <p className="mx-auto mt-3 max-w-xl opacity-80">{b.text}</p>}
            <div className="mt-8"><Countdown endsAt={b.endsAt} /></div>
            {b.button && b.link && <Link href={b.link} className="shine mt-8 inline-block rounded-pill bg-white px-8 py-3.5 text-sm font-semibold text-black transition hover:-translate-y-0.5">{b.button}</Link>}
          </div>
        </section>
      );
    case "gallery": {
      const imgs = b.images.filter((x) => x.src);
      return (
        <section className={wrap}>
          {b.title && <Heading as={b.level} className="mb-6 font-display text-2xl font-semibold md:text-3xl">{b.title}</Heading>}
          {imgs.length === 0 ? <div className="grid aspect-[16/6] place-items-center rounded-3xl border border-dashed border-line text-sm text-muted">Add photo links</div> : (
            <div className="grid auto-rows-[160px] grid-cols-2 gap-3 md:auto-rows-[220px] md:grid-cols-4">
              {imgs.map((x, i) => (
                <figure key={i} className={`group relative overflow-hidden rounded-2xl ${i % 5 === 0 ? "row-span-2" : ""} ${i % 7 === 3 ? "md:col-span-2" : ""}`}>
                  <img src={x.src} alt={x.caption} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                  {x.caption && <figcaption className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/70 to-transparent p-3 text-sm text-white transition duration-300 group-hover:translate-y-0">{x.caption}</figcaption>}
                </figure>
              ))}
            </div>
          )}
        </section>
      );
    }
    case "order": {
      const ids = new Set(b.offers.flatMap((o) => o.items.map((i) => i.productId)));
      return <OrderBlock block={b} products={products.filter((p) => ids.has(p.id))} zones={ctx.zones ?? []} slug={ctx.slug ?? ""} preview={ctx.preview} />;
    }
  }
}

/**
 * Applies a section's heading size, weight and case. A section with none of these set is left untouched,
 * so every existing page keeps its look. `display: contents` means this wrapper never changes the layout.
 */
function TypoScope({ b, children }: { b: Block; children: React.ReactNode }) {
  const size = b.hsize && b.hsize !== "design" ? b.hsize : undefined;
  if (!size && !b.hweight && !b.hcase) return <>{children}</>;
  const style: Record<string, string> = {};
  if (size === "custom" && b.hpx) {
    style["--h-size"] = `${b.hpx}px`;
    style["--h-size-m"] = `${b.hpxm ?? Math.max(14, Math.round(b.hpx * 0.65))}px`;
  }
  if (b.hweight) style["--h-weight"] = b.hweight;
  if (b.hcase) style["--h-case"] = b.hcase;
  return <div className="contents" data-hsize={size === "custom" && !b.hpx ? undefined : size} data-hweight={b.hweight ? "" : undefined} data-hcase={b.hcase ? "" : undefined} style={style as React.CSSProperties}>{children}</div>;
}

export function BlockRenderer({ blocks, ...ctx }: { blocks: Block[] } & BlockCtx) {
  return (
    <>
      {blocks.map((b, i) => {
        const bleed = b.type === "herofull" || b.type === "sliderfull" || b.type === "bannerfull" ? "tight" : b.type === "rail3dfull" ? "wide" : undefined;
        const view = <TypoScope b={b}><BlockView b={b} ctx={ctx} /></TypoScope>;
        // Full width versions: the same section with the page's side margins and rounded corners removed (see globals.css).
        const full = bleed ? <div data-fullbleed={bleed}>{view}</div> : view;
        // Space above and below, set per section in the builder. Sections with none set get no extra wrapper.
        const sp = { paddingTop: b.pt, paddingBottom: b.pb, paddingLeft: b.pl, paddingRight: b.pr, marginTop: b.mt, marginBottom: b.mb, marginLeft: b.ml, marginRight: b.mr };
        const el = Object.values(sp).some((v) => v !== undefined) ? <div style={sp}>{full}</div> : full;
        // The first section is already on screen, and the ready-made 3D slider handles its own entrance.
        if (b.anim === "none" || i === 0 || b.type === "rail3d" || b.type === "rail3dfull") return <div key={b.id}>{el}</div>;
        return <Reveal key={b.id} anim={b.anim}>{el}</Reveal>;
      })}
    </>
  );
}
