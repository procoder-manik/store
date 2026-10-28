import { z } from "zod";
import { isAllowedImageUrl } from "@/lib/utils";
import { formatPrice } from "@/lib/config";
import type { Product } from "@/lib/demo-products";

/** The designed-email format. Pure code (no server-only imports) so the same renderer draws the preview and the real email. */
const text = (n: number) => z.string().trim().max(n);
const link = z.string().trim().max(300).refine((v) => v === "" || v.startsWith("/") || v.startsWith("https://"), "Links must start with / or https://");
const image = z.union([z.literal(""), z.string().max(500).refine(isAllowedImageUrl, "Pictures must be uploaded here or come from Pexels, Unsplash or Pixabay")]);
const id = z.string().max(60);

export const emailBlockSchema = z.discriminatedUnion("type", [
  z.object({ id, type: z.literal("hero"), eyebrow: text(40), heading: text(120), sub: text(240), image, button: text(30), link, tone: z.enum(["dark", "accent", "light"]) }),
  z.object({ id, type: z.literal("text"), heading: text(120), body: text(3000), align: z.enum(["left", "center"]) }),
  z.object({ id, type: z.literal("products"), title: text(80), sub: text(160), showPrice: z.boolean(), button: text(30), items: z.array(z.object({ productId: z.string().uuid(), percent: z.number().int().min(0).max(90) })).max(12) }),
  z.object({ id, type: z.literal("offer"), eyebrow: text(40), headline: text(60), sub: text(200), code: text(30), endsText: text(80) }),
  z.object({ id, type: z.literal("button"), text: text(40), link, align: z.enum(["left", "center"]) }),
  z.object({ id, type: z.literal("image"), image, caption: text(120), link }),
  z.object({ id, type: z.literal("divider") }),
  z.object({ id, type: z.literal("spacer"), size: z.number().int().min(8).max(80) }),
]);
export const emailDesignSchema = z.object({
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a valid color"),
  preheader: text(120),
  blocks: z.array(emailBlockSchema).max(30),
});
export type EBlock = z.infer<typeof emailBlockSchema>;
export type EmailDesign = z.infer<typeof emailDesignSchema>;
export type EBlockType = EBlock["type"];

export const EBLOCK_LABELS: Record<EBlockType, string> = { hero: "Big banner", text: "Text", products: "Products and offers", offer: "Offer highlight and coupon", button: "Button", image: "Picture", divider: "Line", spacer: "Space" };
export const EBLOCK_INFO: Record<EBlockType, string> = {
  hero: "The big opening banner of the email. Use it for the campaign title, like Eid Special Offer.",
  text: "A short message. Use {{name}} to put the customer's first name.",
  products: "Shows the products you drag in, with picture, name and price. Give a product a percent to show an offer price. The percent is shown in the email only. To really charge less, create a coupon and add it in an Offer block.",
  offer: "A highlighted box for the offer, with a coupon code the customer can copy. Create the same code under Coupons so it works at checkout.",
  button: "A clear button, like Shop now.",
  image: "A full-width picture, like a banner you designed.",
  divider: "A thin line to separate parts.",
  spacer: "Empty space between parts.",
};

export function newEmailBlock(type: EBlockType): EBlock {
  const b = { id: crypto.randomUUID() };
  switch (type) {
    case "hero": return { ...b, type, eyebrow: "Special offer", heading: "Our biggest sale of the season", sub: "Hand-picked favorites at special prices, for a short time only.", image: "", button: "Shop the sale", link: "/shop", tone: "dark" };
    case "text": return { ...b, type, heading: "", body: "Hi {{name}},\n\nWrite your message here.", align: "left" };
    case "products": return { ...b, type, title: "Offers picked for you", sub: "", showPrice: true, button: "View", items: [] };
    case "offer": return { ...b, type, eyebrow: "Use this code at checkout", headline: "UP TO 20% OFF", sub: "Valid on the products above.", code: "EID20", endsText: "Offer ends soon" };
    case "button": return { ...b, type, text: "Shop now", link: "/shop", align: "center" };
    case "image": return { ...b, type, image: "", caption: "", link: "" };
    case "divider": return { ...b, type };
    case "spacer": return { ...b, type, size: 24 };
  }
}

export const DEFAULT_DESIGN = (): EmailDesign => ({ accent: "#1f6f78", preheader: "", blocks: [newEmailBlock("hero"), newEmailBlock("products"), newEmailBlock("offer"), newEmailBlock("button")] });

/** An older plain template (heading, message, button, picture) becomes blocks, so it opens in the builder. */
export function legacyToDesign(t: { heading: string; body: string; button_text: string | null; button_url: string | null; image_url: string | null }): EmailDesign {
  const blocks: EBlock[] = [
    { ...(newEmailBlock("hero") as Extract<EBlock, { type: "hero" }>), eyebrow: "", heading: t.heading, sub: "", image: t.image_url ?? "", button: "", link: "", tone: "accent" },
    { ...(newEmailBlock("text") as Extract<EBlock, { type: "text" }>), body: t.body },
  ];
  if (t.button_text && t.button_url) blocks.push({ ...(newEmailBlock("button") as Extract<EBlock, { type: "button" }>), text: t.button_text, link: t.button_url });
  return { accent: "#1f6f78", preheader: "", blocks };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const safeColor = (c: string) => (/^#[0-9a-fA-F]{6}$/.test(c) ? c : "#1f6f78");
export const salePrice = (base: number, percent: number) => Math.round((base * (100 - percent)) / 100);

type Ctx = { design: EmailDesign; products: Product[]; brand: string; logo?: string; siteUrl: string; unsubscribeUrl?: string; firstName?: string; footer?: string };

export function renderEmailDesign(c: Ctx): { html: string; text: string } {
  const accent = safeColor(c.design.accent);
  const first = c.firstName || "there";
  const fill = (s: string) => s.replace(/\{\{\s*name\s*\}\}/gi, first);
  const url = (u: string) => (u.startsWith("/") ? c.siteUrl + u : /^https:\/\//.test(u) ? u : "");
  const byId = new Map(c.products.map((p) => [p.id, p]));
  const btn = (label: string, href: string, bg: string, fg: string) => (href && label ? `<a href="${esc(href)}" style="display:inline-block;background:${bg};color:${fg};text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:999px">${esc(label)}</a>` : "");
  const paras = (s: string, color: string, align: string) => fill(s).split(/\n{2,}/).map((x) => x.trim()).filter(Boolean).map((x) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${color};text-align:${align}">${esc(x).replace(/\n/g, "<br>")}</p>`).join("");
  const plain: (string | false | undefined)[] = [];
  const rows: string[] = [];
  const cell = (inner: string, pad = "28px") => `<tr><td style="padding:${pad}">${inner}</td></tr>`;

  for (const b of c.design.blocks) {
    if (b.type === "hero") {
      const dark = b.tone === "dark", light = b.tone === "light";
      const bg = dark ? "#0f1722" : light ? "#f5f6f8" : accent;
      const fg = light ? "#15171c" : "#ffffff";
      const img = b.image ? `<tr><td><img src="${esc(b.image)}" alt="" width="600" style="display:block;width:100%;height:auto"></td></tr>` : "";
      rows.push(`${img}<tr><td align="center" style="background:${bg};background-image:${dark ? `linear-gradient(135deg,#0f1722 0%,${accent} 160%)` : "none"};padding:44px 32px;color:${fg}">${b.eyebrow ? `<p style="margin:0 0 12px;font-size:12px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;opacity:.85">${esc(fill(b.eyebrow))}</p>` : ""}<h1 style="margin:0;font-size:32px;line-height:1.15;font-weight:800;color:${fg}">${esc(fill(b.heading))}</h1>${b.sub ? `<p style="margin:14px auto 0;max-width:440px;font-size:16px;line-height:1.55;opacity:.9">${esc(fill(b.sub))}</p>` : ""}${b.button && url(b.link) ? `<p style="margin:26px 0 0">${btn(b.button, url(b.link), light ? accent : "#ffffff", light ? "#ffffff" : "#15171c")}</p>` : ""}</td></tr>`);
      plain.push(fill(b.heading), b.sub && fill(b.sub), b.button && url(b.link) ? `${b.button}: ${url(b.link)}` : "", "");
    } else if (b.type === "text") {
      rows.push(cell(`${b.heading ? `<h2 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#15171c;text-align:${b.align}">${esc(fill(b.heading))}</h2>` : ""}${paras(b.body, "#3a3f48", b.align)}`));
      plain.push(b.heading && fill(b.heading), fill(b.body), "");
    } else if (b.type === "products") {
      const items = b.items.map((i) => ({ p: byId.get(i.productId), percent: i.percent })).filter((x): x is { p: Product; percent: number } => !!x.p);
      const card = (p: Product, percent: number) => {
        const href = `${c.siteUrl}/product/${p.slug}`;
        const sale = percent > 0 ? salePrice(p.basePrice, percent) : p.basePrice;
        const was = percent > 0 ? p.basePrice : p.compareAt && p.compareAt > p.basePrice ? p.compareAt : 0;
        return `<a href="${esc(href)}" style="text-decoration:none;color:#15171c;display:block"><div style="position:relative;border:1px solid #e3e6eb;border-radius:14px;overflow:hidden;background:#ffffff">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" width="260" style="display:block;width:100%;height:auto;background:#f5f6f8">` : `<div style="height:200px;background:#f1f3f5;text-align:center;line-height:200px;color:#9aa1ad;font-size:13px">${esc(p.name)}</div>`}<div style="padding:12px 14px 14px;text-align:left"><div style="font-size:14px;font-weight:600;line-height:1.35">${esc(p.name)}</div>${b.showPrice ? `<div style="margin-top:6px;font-size:15px;font-weight:800;color:${accent}">${esc(formatPrice(sale))}${was ? ` <span style="font-size:12px;font-weight:400;color:#9aa1ad;text-decoration:line-through">${esc(formatPrice(was))}</span>` : ""}</div>` : ""}${percent > 0 && b.showPrice ? `<div style="margin-top:6px"><span style="display:inline-block;background:${accent};color:#ffffff;font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px">${percent}% OFF</span></div>` : ""}${b.button ? `<div style="margin-top:10px;font-size:13px;font-weight:700;color:${accent}">${esc(b.button)} &rarr;</div>` : ""}</div></div></a>`;
      };
      let grid = "";
      for (let i = 0; i < items.length; i += 2) {
        const [a, d] = [items[i], items[i + 1]];
        grid += `<tr><td class="col" width="50%" valign="top" style="padding:0 6px 12px 0">${card(a.p, a.percent)}</td><td class="col" width="50%" valign="top" style="padding:0 0 12px 6px">${d ? card(d.p, d.percent) : ""}</td></tr>`;
      }
      rows.push(cell(`${b.title ? `<h2 style="margin:0 0 4px;font-size:22px;line-height:1.3;color:#15171c;text-align:center">${esc(fill(b.title))}</h2>` : ""}${b.sub ? `<p style="margin:0 0 16px;font-size:14px;color:#6b7280;text-align:center">${esc(fill(b.sub))}</p>` : '<div style="height:12px"></div>'}${items.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${grid}</table>` : `<p style="text-align:center;color:#9aa1ad;font-size:13px">No products added yet.</p>`}`, "24px 22px"));
      plain.push(b.title && fill(b.title), ...items.map((x) => `- ${x.p.name}: ${formatPrice(x.percent > 0 ? salePrice(x.p.basePrice, x.percent) : x.p.basePrice)}${x.percent > 0 ? ` (${x.percent}% off)` : ""} ${c.siteUrl}/product/${x.p.slug}`), "");
    } else if (b.type === "offer") {
      rows.push(cell(`<div style="border:2px dashed ${accent};border-radius:16px;padding:26px 20px;text-align:center;background:#fafbfc">${b.eyebrow ? `<p style="margin:0 0 8px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#6b7280;font-weight:700">${esc(fill(b.eyebrow))}</p>` : ""}<p style="margin:0;font-size:34px;line-height:1.1;font-weight:800;color:${accent}">${esc(fill(b.headline))}</p>${b.sub ? `<p style="margin:10px 0 0;font-size:14px;color:#3a3f48">${esc(fill(b.sub))}</p>` : ""}${b.code ? `<p style="margin:18px 0 0"><span style="display:inline-block;background:#15171c;color:#ffffff;font-family:Consolas,Menlo,monospace;font-size:20px;letter-spacing:.18em;font-weight:700;padding:11px 24px;border-radius:10px">${esc(b.code)}</span></p>` : ""}${b.endsText ? `<p style="margin:14px 0 0;font-size:12px;color:#6b7280">${esc(fill(b.endsText))}</p>` : ""}</div>`, "8px 28px 24px"));
      plain.push(fill(b.headline), b.code && `Code: ${b.code}`, b.endsText && fill(b.endsText), "");
    } else if (b.type === "button") {
      rows.push(cell(`<div style="text-align:${b.align}">${btn(b.text, url(b.link), accent, "#ffffff")}</div>`, "8px 28px 28px"));
      if (url(b.link)) plain.push(`${b.text}: ${url(b.link)}`, "");
    } else if (b.type === "image") {
      if (!b.image) continue;
      const im = `<img src="${esc(b.image)}" alt="${esc(b.caption)}" width="600" style="display:block;width:100%;height:auto">`;
      rows.push(`<tr><td>${url(b.link) ? `<a href="${esc(url(b.link))}">${im}</a>` : im}${b.caption ? `<p style="margin:8px 28px 0;font-size:12px;color:#6b7280;text-align:center">${esc(b.caption)}</p>` : ""}</td></tr>`);
    } else if (b.type === "divider") rows.push(`<tr><td style="padding:6px 28px"><div style="height:1px;background:#e3e6eb"></div></td></tr>`);
    else if (b.type === "spacer") rows.push(`<tr><td style="height:${b.size}px;line-height:${b.size}px;font-size:1px">&nbsp;</td></tr>`);
  }

  const logo = c.logo && c.logo.startsWith("https://") ? `<img src="${esc(c.logo)}" alt="${esc(c.brand)}" height="34" style="display:block;margin:0 auto;height:34px;max-width:200px">` : `<span style="font-size:22px;font-weight:800;color:${accent};letter-spacing:-.01em">${esc(c.brand)}</span>`;
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>@media(max-width:520px){.col{display:block!important;width:100%!important;padding:0 0 12px 0!important}}</style></head><body style="margin:0;background:#eef0f3;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#15171c">
${c.design.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(fill(c.design.preheader))}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f3;padding:24px 10px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,34,.08)">
<tr><td align="center" style="padding:22px 28px;border-bottom:3px solid ${accent}">${logo}</td></tr>
${rows.join("\n")}
<tr><td style="padding:22px 28px;background:#f5f6f8;font-size:12px;line-height:1.6;color:#6b7280;text-align:center">${esc(c.footer ?? `You are receiving this email from ${c.brand}.`)}<br><a href="${esc(c.siteUrl)}" style="color:#6b7280">${esc(c.siteUrl.replace(/^https?:\/\//, ""))}</a>${c.unsubscribeUrl ? ` &middot; <a href="${esc(c.unsubscribeUrl)}" style="color:#6b7280">Unsubscribe</a>` : ""}</td></tr>
</table></td></tr></table></body></html>`;
  const textOut = [...plain.filter((x): x is string => typeof x === "string"), ...(c.unsubscribeUrl ? [`Unsubscribe: ${c.unsubscribeUrl}`] : [])].join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return { html, text: textOut };
}
