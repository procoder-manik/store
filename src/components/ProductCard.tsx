import Link from "next/link";
import type { Product } from "@/lib/demo-products";
import { formatPrice } from "@/lib/config";
import { ProductArt } from "./ProductArt";
import { HeartButton } from "./ListButtons";

export function ProductCard({ p }: { p: Product }) {
  const soldOut = (p.variants?.length ?? 0) > 0 && p.variants!.every((v) => v.stock <= 0);
  const onSale = (p.compareAt ?? 0) > p.basePrice || p.tags.includes("sale");
  const badge = soldOut ? "Sold out" : onSale ? "Sale" : p.tags.includes("new") ? "New" : p.tags.includes("hot") ? "Popular" : "";
  const swatches = p.hasColors === false ? [] : p.colors;

  return (
    <div className="group relative">
      <Link href={`/product/${p.slug}`} className="block">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface">
          {p.image ? (
            <>
              <img src={p.image} alt={p.name} loading="lazy" className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-105" />
              {p.images?.[1] && <img src={p.images[1].url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100" />}
            </>
          ) : (
            <ProductArt kind={p.kind} color={p.colors[0].hex} className="aspect-[4/5] w-full transition duration-500 group-hover:scale-105" />
          )}
          {badge && <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-medium ${soldOut ? "bg-ink text-paper" : "bg-surface/90 text-ink backdrop-blur"}`}>{badge}</span>}
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium leading-snug group-hover:underline">{p.name}</p>
            <p className="mt-1 text-sm">
              {formatPrice(p.basePrice)}
              {p.compareAt && p.compareAt > p.basePrice && <span className="ml-2 text-muted line-through">{formatPrice(p.compareAt)}</span>}
            </p>
          </div>
          {swatches.length > 0 && (
            <div className="mt-1 flex shrink-0 -space-x-1">
              {swatches.slice(0, 4).map((c) => <span key={c.name} title={c.name} style={{ background: c.hex }} className="h-4 w-4 rounded-full border border-line ring-2 ring-paper" />)}
              {swatches.length > 4 && <span className="pl-2 text-xs text-muted">+{swatches.length - 4}</span>}
            </div>
          )}
        </div>
      </Link>
      <HeartButton id={p.id} className="absolute right-3 top-3" />
    </div>
  );
}
