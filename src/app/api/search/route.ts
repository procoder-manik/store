import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await rateLimit(`search:${await clientIp()}`, 90, 60))) return NextResponse.json({ items: [] }, { status: 429 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 60);
  if (q.length < 2) return NextResponse.json({ items: [] });
  const words = q.split(/\s+/).filter(Boolean);
  const { products, categories } = await getCatalog();
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
    .map(({ p }) => ({ name: p.name, slug: p.slug, price: p.basePrice, image: p.image ?? "", kind: p.kind, color: p.colors[0].hex }));
  return NextResponse.json({ items });
}
