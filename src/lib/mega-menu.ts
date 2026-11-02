import type { Product } from "@/lib/demo-products";

/** Mega menus: what the owner builds, and what the shop draws. Safe to import anywhere. */
export type MegaLink = { label: string; href: string };
export type PerkIcon = "truck" | "shield" | "refresh" | "headset" | "gift" | "card" | "clock" | "star";
export type ProductSource = "pick" | "category" | "new" | "hot" | "bestseller" | "sale" | "preorder";

export type MegaColumn =
  | { id: string; kind: "links"; title: string; links: MegaLink[] }
  | { id: string; kind: "categories"; title: string }
  | { id: string; kind: "products"; title: string; source: ProductSource; ids: string[]; category: string; count: number; style: "rows" | "cards" }
  | { id: string; kind: "promo"; title: string; text: string; image: string; button: string; link: string; code: string }
  | { id: string; kind: "perks"; title: string; items: { icon: PerkIcon; title: string; text: string }[] };

export type MegaMenu = { id: string; label: string; href: string; enabled: boolean; columns: MegaColumn[] };
export type MegaConfig = { menus: MegaMenu[] };

export type MegaProduct = { id: string; name: string; slug: string; price: number; compareAt: number | null; image: string; preorder: boolean };
export type ShownColumn =
  | Exclude<MegaColumn, { kind: "products" } | { kind: "categories" }>
  | { id: string; kind: "products"; title: string; style: "rows" | "cards"; products: MegaProduct[] };
export type ShownMenu = { label: string; href: string; columns: ShownColumn[] };

const compact = (p: Product): MegaProduct => ({ id: p.id, name: p.name, slug: p.slug, price: p.basePrice, compareAt: (p.compareAt ?? 0) > p.basePrice ? (p.compareAt as number) : null, image: p.image ?? "", preorder: !!p.preorder });

function chooseProducts(c: Extract<MegaColumn, { kind: "products" }>, all: Product[]) {
  if (c.source === "pick") return c.ids.map((id) => all.find((p) => p.id === id)).filter((p): p is Product => !!p);
  const list = c.source === "category" ? all.filter((p) => p.category === c.category)
    : c.source === "sale" ? all.filter((p) => (p.compareAt ?? 0) > p.basePrice)
    : c.source === "preorder" ? all.filter((p) => p.preorder)
    : all.filter((p) => (p.tags as string[]).includes(c.source));
  return list.slice(0, Math.max(1, c.count));
}

/** Turns a saved menu into what the shop draws, using today's products, so prices and stock are never out of date. */
export function showMenu(m: MegaMenu, products: Product[], categories: { id: string; label: string }[]): ShownMenu {
  const columns = m.columns.map((c): ShownColumn => {
    if (c.kind === "categories") return { id: c.id, kind: "links", title: c.title, links: categories.map((x) => ({ label: x.label, href: `/category/${x.id}` })) };
    if (c.kind === "products") return { id: c.id, kind: "products", title: c.title, style: c.style, products: chooseProducts(c, products).map(compact) };
    return c;
  });
  return { label: m.label, href: m.href, columns };
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export const newColumn = (kind: MegaColumn["kind"]): MegaColumn => {
  const id = uid();
  if (kind === "links") return { id, kind, title: "Shop", links: [{ label: "All products", href: "/shop" }] };
  if (kind === "categories") return { id, kind, title: "Categories" };
  if (kind === "products") return { id, kind, title: "Trending now", source: "hot", ids: [], category: "", count: 4, style: "rows" };
  if (kind === "promo") return { id, kind, title: "This week's offer", text: "Tell people what is on.", image: "", button: "Shop now", link: "/offers", code: "" };
  return { id, kind, title: "", items: [{ icon: "truck", title: "Delivery across Bangladesh", text: "Inside and outside Dhaka." }, { icon: "card", title: "Pay your way", text: "Cash on delivery, bKash, Nagad." }, { icon: "refresh", title: "Easy returns", text: "Tell us if something is wrong." }] };
};

/** Ready-made layouts. Each one fills in with the store's real categories and products, then everything can be edited. */
export const MEGA_LAYOUTS: { id: string; name: string; about: string; build: (cats: { id: string; label: string }[]) => MegaColumn[] }[] = [
  {
    id: "showcase", name: "Products beside two lists", about: "Trending products as cards, with categories and a list of your own.",
    build: () => [{ ...newColumn("products"), style: "cards", count: 3 } as MegaColumn, newColumn("categories"), { id: uid(), kind: "links", title: "Shop by room", links: ["Bedroom", "Living room", "Dining room", "Kitchen"].map((label) => ({ label, href: "/shop" })) }],
  },
  {
    id: "lists-products", name: "Lists with a product panel", about: "Your links in columns, and a tinted row of products.",
    build: (cats) => [
      { id: uid(), kind: "links", title: "Shop", links: cats.slice(0, 5).map((c) => ({ label: c.label, href: `/category/${c.id}` })) },
      { id: uid(), kind: "links", title: "Explore", links: [{ label: "All products", href: "/shop" }, { label: "Pre-order", href: "/pre-order" }, { label: "Offers", href: "/offers" }] },
      { ...newColumn("products"), title: "New in", source: "new", style: "cards", count: 3 } as MegaColumn,
    ],
  },
  {
    id: "columns-poster", name: "Many columns and a poster", about: "Several lists of links, with a tall offer poster at the end.",
    build: (cats) => [
      ...cats.slice(0, 3).map((c) => ({ id: uid(), kind: "links" as const, title: c.label, links: [{ label: `All ${c.label}`, href: `/category/${c.id}` }, { label: "New in", href: `/category/${c.id}` }, { label: "Best sellers", href: `/category/${c.id}` }] })),
      { ...newColumn("promo"), title: "Big sale this week", text: "Up to 20% off selected pieces.", button: "See offers" } as MegaColumn,
    ],
  },
  {
    id: "full", name: "Categories, trending and promo", about: "The full store front: categories, products in rows, an offer and your promises.",
    build: () => [newColumn("categories"), { ...newColumn("products"), style: "rows", count: 4 } as MegaColumn, newColumn("promo"), newColumn("perks")],
  },
];
