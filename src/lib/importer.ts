import "server-only";
import { lookup } from "node:dns/promises";
import net from "node:net";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { makeSlug } from "@/lib/slug";
import { chatAI } from "@/lib/ai";
import { isOwnVideoUrl } from "@/lib/validators";
import { CURRENCIES, loadImportSettings } from "@/lib/import-config";

/**
 * Turns a product read from any web page into a draft product in this store: prices converted to taka with your
 * margin added, pictures copied into your own storage, options and sizes as variants. The owner reviews the draft
 * in Admin and publishes it. Nothing here is shown to customers until then.
 */

const text = (n: number) => z.string().trim().max(n);
const link = z.string().trim().max(1500).url();

export const importSchema = z.object({
  source: link.optional(),
  title: text(300).min(2, "The product needs a name"),
  description: text(4000).default(""),
  props: z.array(z.tuple([text(80), text(300)])).max(30).default([]),
  currency: z.enum(CURRENCIES),
  price: z.number().positive().max(10_000_000).nullable().default(null),
  options: z.array(z.object({
    name: text(40).min(1),
    values: z.array(z.object({ name: text(80).min(1), image: link.optional() })).min(1).max(60),
  })).max(3).default([]),
  variants: z.array(z.object({
    options: z.record(text(40), text(80)),
    price: z.number().positive().max(10_000_000),
    inStock: z.boolean().default(true),
  })).max(300).default([]),
  images: z.array(link).max(40).default([]),
  video: link.nullable().default(null),
  ai: z.boolean().optional(),
});

export type ImportResult =
  | { ok: true; id: string; slug: string; stats: { variants: number; images: number; imagesSkipped: number; video: boolean; designs: number }; notes: string[] }
  | { ok: false; error: string };

// ---- Fetching pictures safely: the address comes from a web page, so it must never reach this server's own network.

const MIME: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
const MAX_BYTES = 5 * 1024 * 1024;

function privateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  if (v.startsWith("::ffff:")) return privateIp(v.slice(7));
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb");
}

async function fetchImage(start: string, referer?: string): Promise<{ buf: Buffer; type: string } | null> {
  let current = start;
  for (let hop = 0; hop < 4; hop++) {
    let x: URL;
    try { x = new URL(current); } catch { return null; }
    if (!/^https?:$/.test(x.protocol) || (x.port && !["80", "443"].includes(x.port))) return null;
    try {
      const addrs = net.isIP(x.hostname) ? [{ address: x.hostname }] : await lookup(x.hostname, { all: true });
      if (!addrs.length || addrs.some((a) => privateIp(a.address))) return null;
      const res = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(12_000),
        headers: { "user-agent": "Mozilla/5.0", accept: "image/avif,image/webp,image/*", ...(referer ? { referer } : {}) },
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) return null;
        current = new URL(loc, current).toString();
        continue;
      }
      if (!res.ok || !res.body) return null;
      let type = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
      if (type === "image/jpg") type = "image/jpeg";
      if (!MIME[type] || Number(res.headers.get("content-length") ?? 0) > MAX_BYTES) return null;
      const chunks: Uint8Array[] = [];
      let size = 0;
      const reader = res.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > MAX_BYTES) { await reader.cancel(); return null; }
        chunks.push(value);
      }
      return { buf: Buffer.concat(chunks), type };
    } catch {
      return null;
    }
  }
  return null;
}

/** Copies pictures into the store's own storage, a few at a time. Returns the stored file name for each, or null when one could not be copied. */
async function rehost(urls: string[], referer?: string): Promise<(string | null)[]> {
  const sb = createAdminClient();
  const out: (string | null)[] = new Array(urls.length).fill(null);
  let next = 0;
  async function worker() {
    for (;;) {
      const i = next++;
      if (i >= urls.length) return;
      const got = await fetchImage(urls[i], referer);
      if (!got) continue;
      const name = `${randomUUID()}.${MIME[got.type]}`;
      const { error } = await sb.storage.from("product-images").upload(name, got.buf, { contentType: got.type, cacheControl: "31536000" });
      if (!error) out[i] = name;
    }
  }
  await Promise.all(Array.from({ length: Math.min(6, urls.length) }, worker));
  return out;
}

// ---- Words

const cleanSize = (s: string) => s.replace(/\s*inch\b/gi, '"').replace(/''/g, '"').replace(/\s+"/g, '"').replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").replace(/\s*\*\s*/g, " x ").replace(/(\w)\(/, "$1 (").replace(/\s{2,}/g, " ").trim().slice(0, 30);

const cm = (label: string) => {
  const m = cleanSize(label).match(/([\d.]+)"\s*x\s*([\d.]+)"/);
  return m ? ` (প্রায় ${Math.round(Number(m[1]) * 2.54)} × ${Math.round(Number(m[2]) * 2.54)} সেমি)` : "";
};

async function banglaIntro(title: string, props: [string, string][], about: string): Promise<string | null> {
  const facts = [`Name: ${title}`, ...props.slice(0, 12).map(([k, v]) => `${k}: ${v}`), about ? `About: ${about.slice(0, 600)}` : ""].filter(Boolean).join("\n");
  const r = await chatAI(
    "You write short product descriptions for a Bangladeshi home decor store. Write 2 or 3 plain sentences in Bangla script, friendly and simple. Use only the facts given. Never invent materials, sizes, claims or prices, and never mention where the product comes from. No markdown, no emoji, no list.",
    [{ role: "user", content: facts }],
    { maxTokens: 400, temperature: 0.3 },
  );
  const t = r.ok ? r.text.replace(/\*+/g, "").trim() : "";
  // A free AI model sometimes glues English letters into a Bangla word. That reads badly, so such text is dropped for the plain template.
  const garbled = /[ঀ-৿][A-Za-z]|[A-Za-z][ঀ-৿]/.test(t);
  return /[ঀ-৿]/.test(t) && t.length > 20 && !garbled ? t.slice(0, 700) : null;
}

// ---- The import

export async function importProduct(raw: unknown): Promise<ImportResult> {
  const parsed = importSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "The product data could not be read." };
  const p = parsed.data;
  const settings = await loadImportSettings();
  const rate = settings.rates[p.currency];
  const toTaka = (amount: number) => Math.round(amount * rate) + settings.extra;
  const notes: string[] = [];
  const name = p.title.replace(/\s+/g, " ").slice(0, 120);

  // Options: one is the size, the others together make the "design" shown as swatches.
  const sizeOpt = p.options.find((o) => /size/i.test(o.name));
  const designOpts = p.options.filter((o) => o !== sizeOpt);
  const designName = (sel: Record<string, string>) => designOpts.map((o) => sel[o.name]).filter(Boolean).join(" / ");
  const sizeName = (sel: Record<string, string>) => (sizeOpt ? sel[sizeOpt.name] ?? "" : "");

  type Row = { design: string; size: string; amount: number; inStock: boolean };
  let rows: Row[] = [];
  if (p.variants.length) {
    rows = p.variants.map((v) => ({ design: designName(v.options), size: sizeName(v.options), amount: v.price, inStock: v.inStock }));
  } else if (p.price) {
    const designs = designOpts.length === 1 ? designOpts[0].values.map((v) => v.name) : [""];
    const sizes = sizeOpt ? sizeOpt.values.map((v) => v.name) : [""];
    for (const d of designs) for (const s of sizes) rows.push({ design: d, size: s, amount: p.price, inStock: true });
  }
  if (!rows.length) return { ok: false, error: "No price was found on that page. Type the price in the extension and import again." };
  const buyable = rows.filter((r) => r.inStock);
  const base = Math.min(...(buyable.length ? buyable : rows).map((r) => toTaka(r.amount)));
  const compareExtra = base < 3000 ? 1000 : base < 6000 ? 1250 : 1500;
  const designs = [...new Set(rows.map((r) => r.design).filter(Boolean))];
  const showDesigns = designs.length > 1; // one design only means there is nothing to choose

  // Pictures: the gallery, then one swatch picture per design.
  const swatch = new Map<string, string>();
  if (showDesigns && designOpts.length === 1) for (const v of designOpts[0].values) if (v.image && designs.includes(v.name)) swatch.set(v.name, v.image);
  const galleryUrls = p.images.slice(0, 20);
  const swatchEntries = [...swatch.entries()].slice(0, 40);
  const referer = p.source ? new URL(p.source).origin + "/" : undefined;

  const [stored, intro] = await Promise.all([
    rehost([...galleryUrls, ...swatchEntries.map(([, u]) => u)], referer),
    (p.ai ?? settings.ai) ? banglaIntro(name, p.props, p.description) : Promise.resolve(null),
  ]);
  const gallery = stored.slice(0, galleryUrls.length).filter((s): s is string => !!s);
  const swatches = swatchEntries.map(([n], i) => ({ n, path: stored[galleryUrls.length + i] })).filter((s): s is { n: string; path: string } => !!s.path);
  const skipped = stored.filter((s) => !s).length;
  const cleanup = async () => { await createAdminClient().storage.from("product-images").remove([...gallery, ...swatches.map((s) => s.path)]); };
  if (!gallery.length) {
    await cleanup();
    return { ok: false, error: "None of the pictures could be copied. The site may block downloads, or the pictures are not JPG, PNG or WebP." };
  }
  if (skipped) notes.push(`${skipped} picture${skipped > 1 ? "s" : ""} could not be copied and ${skipped > 1 ? "were" : "was"} left out.`);

  // The description: a short Bangla intro, the specifications, a size guide in inches and centimetres, and the original wording.
  const sizes = [...new Set(rows.map((r) => r.size).filter(Boolean))];
  const lines = [intro ?? `${name}। পছন্দের ${showDesigns ? "ডিজাইন ও " : ""}${sizes.length ? "সাইজ " : ""}বেছে অর্ডার করুন।`];
  if (p.props.length) lines.push("", "স্পেসিফিকেশন:", ...p.props.slice(0, 20).map(([k, v]) => `- ${k}: ${v}`));
  if (sizes.length > 1) lines.push("", "সাইজ গাইড:", ...sizes.map((s) => `- ${cleanSize(s)}${cm(s)}`));
  lines.push("", `Product details: ${p.title}`);
  if (p.description && p.description.length > 40) lines.push("", p.description.slice(0, 1200));
  const description = lines.join("\n").slice(0, 4900);

  const video = p.video && isOwnVideoUrl(p.video) ? p.video : null;
  if (p.video && !video) notes.push("The video was left out. Only videos from supported sources can be shown.");

  const sb = createAdminClient();
  const cat = settings.categoryId
    ? settings.categoryId
    : ((await sb.from("categories").select("id").eq("active", true).order("sort").limit(1).maybeSingle()).data?.id as string | undefined) ?? null;
  const kind = /sheet|quilt|duvet|blanket|pillow|cushion|cover|bed|throw|curtain/i.test(name) ? "cover" : "decor";

  const row = {
    name, slug: makeSlug("", name, "product"), kind, category_id: cat, description,
    base_price: base, compare_at_price: base + compareExtra, tags: ["sale"], status: "draft", seo: {}, video_url: video,
  };
  let ins = await sb.from("products").insert(row).select("id, slug").single();
  if (ins.error?.code === "23505") ins = await sb.from("products").insert({ ...row, slug: `${row.slug}-${Math.random().toString(36).slice(2, 6)}` }).select("id, slug").single();
  if (ins.error || !ins.data) {
    await cleanup();
    return { ok: false, error: ins.error?.message ?? "Could not create the product." };
  }
  const id = ins.data.id as string;
  const fail = async (message: string): Promise<ImportResult> => {
    await sb.from("products").delete().eq("id", id);
    await cleanup();
    return { ok: false, error: message };
  };

  const tag = Math.random().toString(36).slice(2, 8).toUpperCase();
  const seen = new Set<string>();
  const variants = rows.flatMap((r, i) => {
    const key = `${r.design}|${r.size}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{
      product_id: id, sku: `IMP-${tag}-${i + 1}`, color_name: showDesigns ? r.design || null : null, color_hex: null,
      size: r.size ? cleanSize(r.size) : null, price_delta: toTaka(r.amount) - base, stock: r.inStock ? 10 : 0,
    }];
  });
  const v = await sb.from("product_variants").insert(variants);
  if (v.error) return fail(v.error.message);

  const images = [
    ...gallery.map((path, i) => ({ product_id: id, path, alt: name, sort: i })),
    ...swatches.map((s, i) => ({ product_id: id, path: s.path, alt: `design:${s.n}`, sort: 100 + i })),
  ];
  const im = await sb.from("product_images").insert(images);
  if (im.error) return fail(im.error.message);

  return { ok: true, id, slug: ins.data.slug as string, stats: { variants: variants.length, images: gallery.length, imagesSkipped: skipped, video: !!video, designs: showDesigns ? designs.length : 0 }, notes };
}
