import type { Metadata } from "next";
import Link from "next/link";
import { Truck } from "lucide-react";
import { ClaimCoupon } from "@/components/ClaimCoupon";
import { OfferSlider } from "@/components/OfferSlider";
import { ProductCard } from "@/components/ProductCard";
import { getBanners } from "@/lib/banners";
import { getCatalog } from "@/lib/catalog";
import { formatPrice } from "@/lib/config";
import { ruleLive } from "@/lib/free-delivery";
import { getPublicCoupons } from "@/lib/offers";
import { getPublicSettings } from "@/lib/settings";
import { getZones } from "@/lib/zones";

export const metadata: Metadata = { title: "Offers", description: "Every offer running now: free delivery, coupons and products on sale.", alternates: { canonical: "/offers" } };
export const revalidate = 60;

const when = (v: string) => new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "Asia/Dhaka" });

export default async function Offers() {
  const [{ products }, { freeDelivery }, zones, banners, coupons] = await Promise.all([getCatalog(), getPublicSettings(), getZones(), getBanners(), getPublicCoupons()]);
  const free = ruleLive(freeDelivery);
  const areas = free && freeDelivery.zones.length ? zones.filter((z) => freeDelivery.zones.includes(z.id)).map((z) => z.name).join(", ") : "";
  const shown = banners.filter((b) => b.title || b.image);
  const sale = products.filter((p) => (p.compareAt ?? 0) > p.basePrice);
  const empty = !free && !shown.length && !coupons.length && !sale.length;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
      <h1 className="font-display text-[clamp(2.5rem,1.6rem+4vw,4.5rem)] leading-[1.02]">Offers</h1>
      <p className="mt-3 max-w-xl text-muted">Everything running right now, in one place.</p>

      {empty && (
        <div className="mt-10 rounded-3xl border border-line bg-surface p-8 text-center">
          <p className="text-muted">No offers are running today.</p>
          <Link href="/shop" className="mt-4 inline-block rounded-pill bg-accent px-6 py-3 text-sm font-semibold text-accent-ink">See all products</Link>
        </div>
      )}

      {free && (
        <section aria-label="Free delivery" className="mt-8 flex items-center gap-4 rounded-3xl border border-line bg-surface p-5 md:p-6">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-accent-ink"><Truck size={22} /></span>
          <div>
            <p className="font-display text-xl md:text-2xl">Free delivery on orders of {formatPrice(freeDelivery.amount)} or more</p>
            <p className="mt-1 text-sm text-muted">{areas ? `In ${areas}.` : "Everywhere we deliver."}{freeDelivery.endsAt ? ` Until ${when(`${freeDelivery.endsAt}T12:00:00+06:00`)}.` : ""} It comes off by itself at checkout.</p>
          </div>
        </section>
      )}

      {coupons.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl md:text-3xl">Coupons</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coupons.map((c) => (
              <li key={c.code} className="grid gap-3 rounded-3xl border border-line bg-surface p-5">
                <div>
                  <p className="font-display text-2xl">{c.type === "percent" ? `${c.value}% off` : `${formatPrice(c.value)} off`}</p>
                  <p className="mt-1 text-sm text-muted">{c.minSubtotal > 0 ? `On orders of ${formatPrice(c.minSubtotal)} or more.` : "On any order."}{c.endsAt ? ` Until ${when(c.endsAt)}.` : ""}</p>
                </div>
                <ClaimCoupon code={c.code} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {shown.length > 0 && (
        <section className="mt-10 grid gap-4">
          <h2 className="font-display text-2xl md:text-3xl">Running now</h2>
          {shown.map((b) => <div key={b.id} className="overflow-hidden rounded-3xl"><OfferSlider banners={[b]} size="band" /></div>)}
        </section>
      )}

      {sale.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl md:text-3xl">On sale</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">{sale.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </section>
      )}
    </main>
  );
}
