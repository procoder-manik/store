import "server-only";
import { getBanners } from "@/lib/banners";
import { getBundles } from "@/lib/bundles";
import { getCatalog } from "@/lib/catalog";
import { formatPrice, SITE_URL } from "@/lib/config";
import { getPublicSettings } from "@/lib/settings";
import { createPublicClient } from "@/lib/supabase/public";
import type { Product } from "@/lib/demo-products";
import { availableMethods } from "@/lib/payments";
import { sslConfigured } from "@/lib/sslcommerz";
import { INFO_SLUGS, INFO_TITLES, infoDefault, type InfoSlug } from "@/lib/info-pages";

/**
 * What the shopping assistant knows. It is rebuilt from the live store for every message, so a change in Admin is known at once.
 * Privacy rests on two things here: the client below is the anonymous one, which the database refuses orders, customers, staff,
 * leads and coupons, and every line is built from named fields, so a new private column can never slip into the prompt.
 */

export type ChatProduct = { name: string; slug: string; price: number; compareAt: number | null; image: string };
export type ChatLink = { href: string; label: string };
export type ChatContext = { text: string; products: Map<string, ChatProduct>; links: Map<string, string> };

const MAX_LISTED = 200;
const PAGE_TEXT = 1500;
const TEXT_KEYS = new Set(["heading", "sub", "title", "intro", "body", "text", "tagline", "eyebrow", "caption", "q", "a", "quote", "label", "items", "parts", "slides", "offers"]);

function words(s: string) {
  return s.toLowerCase().split(/[^a-z0-9ঀ-৿]+/).filter((w) => w.length > 2);
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

const units = (p: Product) => (p.variants ?? []).reduce((n, v) => n + v.stock, 0);
// Only a state goes out, never the exact count.
const stockOf = (p: Product) => (!p.variants?.length ? "available" : units(p) <= 0 ? "sold out" : units(p) <= 8 ? "low stock" : "in stock");
const isSale = (p: Product) => p.compareAt != null && p.compareAt > p.basePrice;
const dhakaDate = (v: string | Date) => new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka" });

function price(p: Product) {
  return `${formatPrice(p.basePrice)}${isSale(p) ? ` (was ${formatPrice(p.compareAt as number)})` : ""}`;
}

function brief(p: Product, catName: Map<string, string>) {
  return [
    `- ${p.name}`,
    price(p),
    catName.get(p.category) ?? "",
    p.tags.length ? `labels: ${p.tags.join(", ")}` : "",
    p.preorder ? `PRE-ORDER${p.preorderDate ? `, arrives ${dhakaDate(p.preorderDate)}` : ""}` : stockOf(p),
    p.hasColors === false ? "" : `colors: ${p.colors.map((c) => c.name).join("/")}`,
    p.sizes.length ? `sizes: ${p.sizes.join("/")}` : "",
    `/product/${p.slug}`,
  ].filter(Boolean).join(" | ");
}

function detail(p: Product, rating?: { sum: number; n: number }) {
  const options = (p.variants ?? []).map((v) => {
    const label = [v.colorName, v.size].filter(Boolean).join(" ") || "Standard";
    return `${label}: ${formatPrice(p.basePrice + v.priceDelta)}, ${v.stock > 0 ? "in stock" : "sold out"}`;
  }).slice(0, 24).join("; ");
  return [
    `${p.name} (${price(p)}, /product/${p.slug})`,
    p.description.replace(/\s+/g, " ").slice(0, 700),
    options && `Options: ${options}.`,
    p.offerEndsAt && `Offer ends ${dhakaDate(p.offerEndsAt)}.`,
    rating?.n ? `Customer rating ${(rating.sum / rating.n).toFixed(1)} of 5 from ${rating.n} reviews.` : "",
  ].filter(Boolean).join(" ");
}

/** The words on a page, taken from text fields only. Pictures, links, custom code and the names on customer quotes stay out. */
function blockText(v: unknown, out: string[]) {
  if (typeof v === "string") { if (v.trim()) out.push(v.trim()); return; }
  if (Array.isArray(v)) { v.forEach((x) => blockText(x, out)); return; }
  if (!v || typeof v !== "object") return;
  const o = v as Record<string, unknown>;
  if (typeof o.label === "string" && typeof o.price === "number") { out.push(`${o.label}: ${formatPrice(o.price)}`); return; }
  for (const k of Object.keys(o)) if (TEXT_KEYS.has(k)) blockText(o[k], out);
}

function pageText(blocks: unknown) {
  const out: string[] = [];
  for (const b of Array.isArray(blocks) ? blocks : []) if ((b as { type?: string })?.type !== "html") blockText(b, out);
  return out.join(". ").replace(/\s+/g, " ").slice(0, PAGE_TEXT);
}

export async function buildChatContext(question: string, path = ""): Promise<ChatContext> {
  const [{ products, categories }, settings, banners, bundles] = await Promise.all([getCatalog(), getPublicSettings(), getBanners(), getBundles()]);
  const sb = createPublicClient();
  const [zones, pages, reviews] = sb
    ? await Promise.all([
        sb.from("shipping_zones").select("name, fee, free_over").eq("active", true).order("sort"),
        sb.from("pages").select("slug, kind, title, description, blocks").eq("status", "active").limit(40),
        sb.from("reviews").select("product_id, rating").eq("status", "approved").limit(2000),
      ])
    : [null, null, null];

  const catName = new Map(categories.map((c) => [c.id, c.label]));
  const links = new Map<string, string>([["/shop", "See all products"], ["/track", "Track your order"], ["/pre-order", "Pre-order"], ["/contact", "Contact us"]]);
  for (const c of categories) links.set(`/category/${c.id}`, c.label);
  for (const s of INFO_SLUGS) links.set(`/${s}`, INFO_TITLES[s]);

  const ratings = new Map<string, { sum: number; n: number }>();
  for (const r of (reviews?.data ?? []) as { product_id: string; rating: number }[]) {
    const x = ratings.get(r.product_id) ?? { sum: 0, n: 0 };
    ratings.set(r.product_id, { sum: x.sum + r.rating, n: x.n + 1 });
  }

  // Follow-up questions like "how much is it?" lean on what came before, and on the page the customer is reading.
  const q = words(question);
  const ranked = products.map((p) => ({ p, s: score(p, q) })).sort((a, b) => b.s - a.s);
  const viewing = path.startsWith("/product/") ? products.find((p) => p.slug === path.slice(9)) : undefined;
  const hits = ranked.filter((x) => x.s > 0).slice(0, 5).map((x) => x.p);
  const detailed = [...new Set([...(viewing ? [viewing] : []), ...hits])];

  const pageRows = (pages?.data ?? []) as { slug: string; kind: string | null; title: string; description: string | null; blocks: unknown }[];
  const edited = new Set(pageRows.map((p) => p.slug));
  const written = pageRows.map((p) => {
    const info = (INFO_SLUGS as readonly string[]).includes(p.slug);
    const href = p.slug === "home" ? "/" : info ? `/${p.slug}` : p.kind === "landing" ? `/lp/${p.slug}` : `/p/${p.slug}`;
    if (href !== "/") links.set(href, p.title);
    return `${p.title} (${href}): ${[p.description, pageText(p.blocks)].filter(Boolean).join(". ")}`;
  });
  const builtIn = (INFO_SLUGS as readonly InfoSlug[]).filter((s) => !edited.has(s) && s !== "contact" && s !== "privacy" && s !== "terms").map((slug) => {
    const d = infoDefault(slug, settings.brand.name, settings.contact.email);
    return `${d.title} (/${slug}): ${[d.intro, ...d.sections.map((x) => `${x.heading}: ${x.body}`), ...(d.faq ?? []).map((f) => `${f.q} ${f.a}`)].join(" ").replace(/\s+/g, " ").slice(0, PAGE_TEXT)}`;
  });

  const menu = [...settings.header.links, ...settings.footer.columns.flatMap((c) => c.links)];
  for (const l of menu) if (l.href.startsWith("/") && l.href.length > 1 && !links.has(l.href)) links.set(l.href, l.label);

  const zoneRows = (zones?.data ?? []) as { name: string; fee: number | string; free_over: number | string | null }[];
  const delivery = zoneRows.length
    ? `${zoneRows.map((z) => `${z.name}: ${formatPrice(Number(z.fee))}${z.free_over != null ? `, free on orders of ${formatPrice(Number(z.free_over))} or more` : ", no free delivery offer"}`).join("; ")}. These are the only delivery areas. The customer picks one at checkout.`
    : "The fee is shown at checkout.";

  const adv = settings.payments.advance;
  const methods = availableMethods(settings.payments, { sslReady: sslConfigured() });
  const pay = methods.map((m) => (m.manual && m.id !== "bank" ? `${m.name} (send to ${m.account})` : m.name)).join(", ");
  const advance = [
    adv.deliveryFirst && "With cash on delivery the delivery charge is paid in advance and the rest to the rider.",
    adv.partialEnabled && `Customers can also pay ${adv.percent}% of the products plus delivery first${adv.partialRequired ? " (this is required for cash on delivery)" : ""}.`,
    adv.preorderPartial && `Pre-orders need ${adv.percent}% of the products plus delivery in advance.`,
  ].filter(Boolean).join(" ");

  const onSale = products.filter(isSale);
  const offers = [
    settings.announcement.enabled && settings.announcement.text && `Store notice: ${settings.announcement.text}`,
    ...banners.filter((b) => b.title).map((b) => `${b.title}${b.subtitle ? `: ${b.subtitle}` : ""}${b.link.startsWith("/") ? ` (${b.link})` : ""}`),
    settings.popup.enabled && settings.popup.code && `${settings.popup.title}. ${settings.popup.text} Code: ${settings.popup.code}`,
    ...bundles.map((b) => `Bundle "${b.name}": ${b.percent}% off when bought together (${products.filter((p) => b.productIds.includes(p.id)).map((p) => p.name).join(", ")})`),
    onSale.length ? `Products on sale now: ${onSale.slice(0, 30).map((p) => `${p.name} ${price(p)}${p.offerEndsAt ? `, ends ${dhakaDate(p.offerEndsAt)}` : ""}`).join("; ")}` : "",
  ].filter(Boolean);

  const upcoming = products.filter((p) => p.preorder);
  const fresh = products.filter((p) => p.tags.includes("new" as never)).slice(0, 12);
  const c = settings.contact;
  const whatsapp = settings.chat.waEnabled ? settings.chat.waNumber || c.whatsapp : c.whatsapp;
  const contact = [c.businessName && `business name ${c.businessName}`, c.phone && `phone ${c.phone}`, c.phone2 && `phone ${c.phone2}`, whatsapp && `WhatsApp ${whatsapp}`, c.email && `email ${c.email}`, c.address && `address ${c.address}`, c.hours && `hours ${c.hours}`].filter(Boolean).join("; ");

  const text = [
    `STORE: ${settings.brand.name}. ${settings.brand.tagline}. Today is ${dhakaDate(new Date())}.`,
    viewing && `THE CUSTOMER IS LOOKING AT: ${viewing.name}. "This product" means this one.`,
    `OFFERS RUNNING NOW:\n${offers.length ? offers.join("\n") : "No special offers right now."}`,
    `UPCOMING PRODUCTS (open for pre-order at /pre-order):\n${upcoming.length ? upcoming.map((p) => `${p.name} ${price(p)}${p.preorderDate ? `, arrives ${dhakaDate(p.preorderDate)}` : ""} (/product/${p.slug})`).join("\n") : "None right now."}`,
    fresh.length ? `NEW IN STORE: ${fresh.map((p) => p.name).join(", ")}` : "",
    `DELIVERY: ${delivery}`,
    `PAYMENT METHODS OPEN NOW: ${pay || "ask the team"}. ${advance}`,
    contact && `CONTACT: ${contact}`,
    `WEBSITE PAGES: ${[...links].map(([href, label]) => `${label} ${href}`).join("; ")}`,
    `CATEGORIES: ${categories.map((x) => `${x.label} (/category/${x.id})`).join(", ") || "none yet"}`,
    `ALL ${products.length} PRODUCTS:\n${ranked.slice(0, MAX_LISTED).map((x) => brief(x.p, catName)).join("\n") || "none yet"}`,
    detailed.length ? `PRODUCT DETAILS:\n${detailed.map((p) => detail(p, ratings.get(p.id))).join("\n")}` : "",
    `WHAT THE WEBSITE PAGES SAY:\n${[...written, ...builtIn].join("\n")}`,
    settings.chat.knowledge ? `STORE NOTES FROM THE OWNER:\n${settings.chat.knowledge.slice(0, 3000)}` : "",
  ].filter(Boolean).join("\n\n");

  return {
    text,
    links,
    products: new Map(products.map((p) => [p.slug, { name: p.name, slug: p.slug, price: p.basePrice, compareAt: isSale(p) ? (p.compareAt as number) : null, image: p.image ?? "" }])),
  };
}

const PATH = /(?<![\w/.:-])\/(?:(?:product|category|p|lp)\/[a-z0-9-]+|[a-z][a-z0-9-]*)(?![\w/-])/g;

/** Tidies a reply for the chat window: page paths become cards and buttons, and any contact detail that is not the store's own is hidden. */
export function finishReply(raw: string, ctx: ChatContext) {
  const products: ChatProduct[] = [];
  const links: ChatLink[] = [];
  const digits = ctx.text.replace(/\D/g, "");
  const known = ctx.text.toLowerCase();

  const text = raw
    .split(SITE_URL).join("")
    .replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, "$1 $2")
    .replace(/\*\*|__/g, "")
    .replace(/^\s*[*-]\s+/gm, "• ")
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, (m) => (known.includes(m.toLowerCase()) ? m : "(hidden)"))
    .replace(/(?:\+?88)?01[3-9](?:[\s-]?\d){8}/g, (m) => (digits.includes(m.replace(/\D/g, "").slice(-11)) ? m : "(hidden)"))
    .replace(PATH, (href) => {
      const slug = href.startsWith("/product/") ? href.slice(9) : "";
      const p = slug ? ctx.products.get(slug) : undefined;
      const label = ctx.links.get(href);
      if (p) { if (!products.some((x) => x.slug === slug)) products.push(p); return ""; }
      if (label) { if (!links.some((x) => x.href === href)) links.push({ href, label }); return ""; }
      return /^\/(product|category|p|lp)\//.test(href) ? "" : href; // a page that does not exist is never offered
    })
    .replace(/\(\s*\)/g, "")
    .replace(/[ \t]+([,.!?:;।])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/^[ \t]*•?[ \t]*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { reply: (text || "Here you go.").slice(0, 2000), products: products.slice(0, 4), links: links.slice(0, 3) };
}
