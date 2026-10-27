import "server-only";
import { getCatalog } from "@/lib/catalog";
import { formatPrice } from "@/lib/config";
import { getPublicSettings } from "@/lib/settings";
import { createPublicClient } from "@/lib/supabase/public";
import type { Product } from "@/lib/demo-products";

function words(s: string) {
  return s.toLowerCase().split(/[^a-z0-9\u0980-\u09ff]+/).filter((w) => w.length > 2);
}

function score(p: Product, q: string[]) {
  const name = p.name.toLowerCase(), cat = p.category.toLowerCase();
  const desc = p.description.toLowerCase(), cols = p.colors.map((c) => c.name.toLowerCase()).join(" ");
  let s = 0;
  for (const w of q) {
    if (name.includes(w)) s += 3;
    if (cat.includes(w) || p.kind.includes(w)) s += 2;
    if (cols.includes(w)) s += 2;
    if (desc.includes(w)) s += 1;
  }
  return s;
}

function line(p: Product) {
  const stock = (p.variants?.length ?? 0) === 0 ? "available" : p.variants!.reduce((n, v) => n + v.stock, 0) <= 0 ? "sold out" : p.variants!.reduce((n, v) => n + v.stock, 0) <= 8 ? "low stock" : "in stock";
  const colors = p.hasColors === false ? "" : `, colors: ${p.colors.map((c) => c.name).join("/")}`;
  const sizes = p.sizes.length ? `, sizes: ${p.sizes.join("/")}` : "";
  const first = p.description.split("\n")[0].slice(0, 140);
  return `- ${p.name}: ${formatPrice(p.basePrice)}${colors}${sizes}, ${stock}, page /product/${p.slug}. ${first}`;
}

/** Retrieval for the shopping assistant: only live store data goes into the prompt, nothing else. */
export async function buildChatContext(question: string): Promise<string> {
  const [{ products, categories }, settings] = await Promise.all([getCatalog(), getPublicSettings()]);
  const q = words(question);
  const ranked = products.map((p) => ({ p, s: score(p, q) })).sort((a, b) => b.s - a.s);
  const hits = ranked.filter((x) => x.s > 0).slice(0, 6).map((x) => x.p);
  const picks = hits.length ? hits : products.filter((p) => p.tags.some((t) => t === "featured" || t === "hot")).slice(0, 4);

  let delivery = "Delivery fees are shown at checkout.";
  const sb = createPublicClient();
  if (sb) {
    const { data } = await sb.from("shipping_zones").select("name, fee, free_over").eq("active", true).order("sort");
    if (data?.length) delivery = data.map((z) => `${z.name}: ${formatPrice(Number(z.fee))}${z.free_over != null ? ` (free over ${formatPrice(Number(z.free_over))})` : ""}`).join("; ");
  }

  return [
    `STORE: ${settings.brand.name}. ${settings.brand.tagline}.`,
    `PAYMENT: Cash on delivery. Customers can also track orders at /track and see everything at /shop.`,
    `DELIVERY: ${delivery}`,
    `CATEGORIES: ${categories.map((c) => `${c.label} (/category/${c.id})`).join(", ") || "none yet"}`,
    `RELEVANT PRODUCTS:\n${picks.length ? picks.map(line).join("\n") : "No products match."}`,
    settings.chat.knowledge ? `STORE NOTES FROM THE OWNER:\n${settings.chat.knowledge.slice(0, 3000)}` : "",
  ].filter(Boolean).join("\n\n");
}
