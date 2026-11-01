import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
import type { Product } from "@/lib/demo-products";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const hit = (p: Product) => ({ name: p.name, slug: p.slug, price: p.basePrice, compareAt: p.compareAt != null && p.compareAt > p.basePrice ? p.compareAt : null, image: p.image ?? "", kind: p.kind, color: p.colors[0].hex });

export async function GET(req: Request) {
  if (!(await rateLimit(`search:${await clientIp()}`, 90, 60))) return NextResponse.json({ items: [], cats: [] }, { status: 429 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 60);
  const { products, categories } = await getCatalog();
  // Before anything is typed, the panel offers somewhere to start.
  if (q.length < 2) {
    const fresh = products.filter((p) => p.tags.some((t) => t === "new" || t === "hot"));
    return NextResponse.json({ items: (fresh.length >= 4 ? fresh : products).slice(0, 4).map(hit), cats: categories.map((c) => ({ id: c.id, label: c.label })) });
  }
  const words = q.split(/\s+/).filter(Boolean);
  const catName = new Map(categories.map((c) => [c.id, c.label.toLowerCase()]));
  const items = products
    .map((p) => {
      const name = p.name.toLowerCase(), cat = catName.get(p.category) ?? "", desc = p.description.toLowerCase(), cols = p.colors.map((c) => c.name.toLowerCase()).join(" ");
      let s = 0;
      for (const w of words) { if (name.includes(w)) s += 4; if (cat.includes(w)) s += 2; if (cols.includes(w)) s += 2; if (desc.includes(w)) s += 1; }
      return { p, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 8)
    .map(({ p }) => hit(p));
  const cats = categories.filter((c) => words.some((w) => c.label.toLowerCase().includes(w))).slice(0, 3).map((c) => ({ id: c.id, label: c.label }));
  return NextResponse.json({ items, cats });
}
