import { newBlock, type Block } from "@/lib/blocks";
import { INFO_TITLES, infoDefault, type InfoSlug } from "@/lib/info-pages";

export const BUILTIN: { slug: string; title: string; path: string }[] = [
  { slug: "home", title: "Home page", path: "/" },
  { slug: "about", title: INFO_TITLES.about, path: "/about" },
  { slug: "faq", title: INFO_TITLES.faq, path: "/faq" },
  { slug: "shipping", title: INFO_TITLES.shipping, path: "/shipping" },
  { slug: "returns", title: INFO_TITLES.returns, path: "/returns" },
  { slug: "size-guide", title: INFO_TITLES["size-guide"], path: "/size-guide" },
  { slug: "privacy", title: INFO_TITLES.privacy, path: "/privacy" },
  { slug: "terms", title: INFO_TITLES.terms, path: "/terms" },
];

/** The built-in version of a page as blocks, so it can be edited, reordered and extended. */
export function defaultBlocks(slug: string, brand: string, email: string): Block[] {
  if (slug === "home") {
    const rail = newBlock("rail3d");
    rail.level = "h1"; // the home page keeps one main heading
    const cats = newBlock("categories");
    const banners = newBlock("banners");
    const hot = newBlock("products");
    const fresh = newBlock("products");
    if (hot.type === "products") Object.assign(hot, { title: "Popular right now", source: "tag", tag: "hot", count: 4 });
    if (fresh.type === "products") Object.assign(fresh, { title: "Just in", source: "tag", tag: "new", count: 4 });
    return [rail, cats, banners, hot, fresh];
  }
  const d = infoDefault(slug as InfoSlug, brand, email);
  const out: Block[] = [];
  const head = newBlock("pagehead");
  head.level = "h1";
  if (head.type === "pagehead") { head.title = d.title; head.intro = d.intro; }
  out.push(head);
  for (const s of d.sections) {
    const t = newBlock("text");
    if (t.type === "text") { t.heading = s.heading; t.body = s.body; }
    out.push(t);
  }
  if (d.faq?.length) {
    const f = newBlock("faq");
    if (f.type === "faq") { f.title = "Questions"; f.items = d.faq.slice(0, 12); }
    out.push(f);
  }
  return out;
}
