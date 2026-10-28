import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/catalog";
import { getPublicSettings } from "@/lib/settings";
import { ProductArt } from "@/components/ProductArt";
import { PrintButton } from "@/components/PrintButton";

export const revalidate = 60;
export const metadata: Metadata = { title: "Catalog", description: "Browse everything we make. Message us for prices and orders." };

/** A product book with pictures and names only. No prices, so it stays correct when prices change. */
export default async function Catalog() {
  const [{ products, categories }, s] = await Promise.all([getCatalog(), getPublicSettings()]);
  if (!s.extras.catalog) notFound();
  const wa = s.chat.waNumber || s.contact.whatsapp;
  const groups = categories.map((c) => ({ c, items: products.filter((p) => p.category === c.id) })).filter((g) => g.items.length > 0);
  const other = products.filter((p) => !categories.some((c) => c.id === p.category));
  if (other.length) groups.push({ c: { id: "other", label: "More" } as (typeof categories)[number], items: other });
  const ask = (name: string) => (wa ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hi, I would like the price of: ${name}`)}` : "");

  return (
    <main>
      <div className="relative overflow-hidden border-b border-line bg-gradient-to-br from-accent/10 via-surface to-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-5 py-10 md:py-14">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{s.brand.name}</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-5xl">Product catalog</h1>
            <span aria-hidden className="mt-4 block h-1 w-14 rounded-full bg-accent" />
            <p className="mt-4 max-w-xl text-muted">Everything we make, all in one place. {wa ? "Tap Ask for price on any item to message us on WhatsApp." : "Contact us for prices and orders."}</p>
          </div>
          <PrintButton />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5 py-10">
        {groups.length === 0 && <p className="text-sm text-muted">No products yet.</p>}
        {groups.map(({ c, items }) => (
          <section key={c.id} className="mb-12 break-inside-avoid">
            <h2 className="mb-5 border-b border-line pb-2 font-display text-2xl font-semibold">{c.label}</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
              {items.map((p) => (
                <figure key={p.id} className="break-inside-avoid">
                  <div className="overflow-hidden rounded-2xl border border-line bg-surface">
                    {p.image ? <img src={p.image} alt={p.name} loading="lazy" className="aspect-[4/5] w-full object-cover" /> : <ProductArt kind={p.kind} color={p.colors[0]?.hex ?? "#cfd2d8"} className="aspect-[4/5] w-full" />}
                  </div>
                  <figcaption className="mt-3 text-sm font-medium leading-snug">{p.name}</figcaption>
                  {wa && <a href={ask(p.name)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-semibold text-accent underline print:hidden">Ask for price</a>}
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
