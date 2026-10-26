"use client";

import Link from "next/link";
import type { Product } from "@/lib/demo-products";
import { formatPrice } from "@/lib/config";
import { useCompare, useMounted } from "@/lib/lists";
import { ProductArt } from "./ProductArt";

export function CompareView({ products }: { products: Product[] }) {
  const { ids, toggle, clear } = useCompare();
  const mounted = useMounted();
  const list = ids.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p);
  if (!mounted) return null;
  if (list.length === 0) return <p className="mt-8 text-sm text-muted">Pick up to 4 products with the Compare button on a product. <Link href="/shop" className="underline">Browse the shop</Link>.</p>;

  const th = "w-28 py-3 pr-3 text-left align-top text-xs font-medium text-muted";
  const rows: [string, (p: Product) => React.ReactNode][] = [
    ["Price", (p) => <span className="font-medium">{formatPrice(p.basePrice)}</span>],
    ["Colors", (p) => (p.hasColors === false ? "None" : <span className="flex flex-wrap gap-1.5">{p.colors.map((c) => <span key={c.name} title={c.name} style={{ background: c.hex }} className="h-5 w-5 rounded-full border border-line" />)}</span>)],
    ["Sizes", (p) => (p.sizes.length ? p.sizes.join(", ") : "One size")],
    ["Tags", (p) => (p.tags.length ? p.tags.join(", ") : "None")],
    ["About", (p) => <span className="text-muted">{p.description.split("\n")[0]}</span>],
  ];

  return (
    <>
      <button onClick={clear} className="mt-4 text-sm text-muted underline">Clear all</button>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className={th} />
              {list.map((p) => (
                <td key={p.id} className="w-1/4 pb-4 pr-4 align-top">
                  <Link href={`/product/${p.slug}`} className="block">
                    {p.image ? <img src={p.image} alt={p.name} className="aspect-[4/5] w-full rounded-xl border border-line object-cover" /> : <ProductArt kind={p.kind} color={p.colors[0].hex} className="aspect-[4/5] w-full rounded-xl border border-line" />}
                    <span className="mt-2 block font-medium">{p.name}</span>
                  </Link>
                  <button onClick={() => toggle(p.id)} className="mt-1 text-xs text-muted underline">Remove</button>
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, cell]) => (
              <tr key={label} className="border-t border-line">
                <th scope="row" className={th}>{label}</th>
                {list.map((p) => <td key={p.id} className="py-3 pr-4 align-top">{cell(p)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
