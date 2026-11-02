import type { Theme } from "@/lib/themes";

export type EmailParts = {
  brand: string; logo?: string; heading: string; body: string; buttonText?: string; buttonUrl?: string; imageUrl?: string;
  footer?: string; unsubscribeUrl?: string; siteUrl: string;
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function url(u: string | undefined, site: string) {
  if (!u) return "";
  if (u.startsWith("/")) return site + u;
  return /^https:\/\//.test(u) ? u : "";
}

// The colours written into every email. Just before sending, these exact values are swapped for the active theme's own.
const BASE = { paper: "#f5f6f8", surface: "#ffffff", ink: "#15171c", body: "#3a3f48", muted: "#6b7280", line: "#e3e6eb", accent: "#1f6f78", accentInk: "#fdfdfe", tint: "#dcecee" };
const NIGHT = { paper: "#010203", surface: "#010204", ink: "#010205", muted: "#010206", line: "#010207", accent: "#010208", accentInk: "#010209" };

const STYLE = `:root{color-scheme:light dark;supported-color-schemes:light dark}
@media (prefers-color-scheme:dark){.em-bg{background:${NIGHT.paper}!important}.em-card{background:${NIGHT.surface}!important;border-color:${NIGHT.line}!important}.em-ink{color:${NIGHT.ink}!important}.em-muted{color:${NIGHT.muted}!important}.em-btn{background:${NIGHT.accent}!important;color:${NIGHT.accentInk}!important}}`;

/** One classy layout for every email. Admin text is escaped, never trusted as HTML. */
export function brandedEmail(p: EmailParts): { html: string; text: string } {
  const link = url(p.buttonUrl, p.siteUrl);
  const img = url(p.imageUrl, p.siteUrl);
  const paras = p.body.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><style>${STYLE}</style></head>
<body class="em-bg" style="margin:0;background:${BASE.paper};font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BASE.ink};-webkit-font-smoothing:antialiased">
<table class="em-bg" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BASE.paper};background-image:radial-gradient(90% 60% at 85% 0%,${BASE.tint} 0%,${BASE.paper} 70%);padding:44px 14px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px"><tr><td align="center" class="em-ink" style="padding:0 0 22px;font-size:17px;font-weight:600;letter-spacing:-0.02em;color:${BASE.ink}">${p.logo && p.logo.startsWith("https://") ? `<img src="${esc(p.logo)}" alt="${esc(p.brand)}" height="34" style="display:block;height:34px;max-width:200px;object-fit:contain">` : esc(p.brand)}</td></tr></table>
<table class="em-card" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${BASE.surface};background-color:${BASE.surface};border:1px solid ${BASE.line};border-radius:28px;overflow:hidden;box-shadow:0 24px 60px -30px rgba(0,0,0,0.28);-webkit-backdrop-filter:blur(24px) saturate(180%);backdrop-filter:blur(24px) saturate(180%)">
${img ? `<tr><td><img src="${esc(img)}" alt="" width="520" style="display:block;width:100%;height:auto"></td></tr>` : ""}
<tr><td style="padding:38px 34px 34px">
<h1 class="em-ink" style="margin:0 0 14px;font-size:28px;line-height:1.14;font-weight:700;letter-spacing:-0.03em;color:${BASE.ink}">${esc(p.heading)}</h1>
${paras.map((x) => `<p class="em-muted" style="margin:0 0 14px;font-size:16px;line-height:1.5;letter-spacing:-0.01em;color:${BASE.body}">${esc(x).replace(/\n/g, "<br>")}</p>`).join("")}
${link && p.buttonText ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 2px"><tr><td class="em-btn" style="border-radius:999px;background:${BASE.accent}"><a class="em-btn" href="${esc(link)}" style="display:inline-block;background:${BASE.accent};color:${BASE.accentInk};text-decoration:none;font-weight:600;font-size:16px;letter-spacing:-0.01em;padding:14px 30px;border-radius:999px">${esc(p.buttonText)}</a></td></tr></table>` : ""}
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px"><tr><td align="center" class="em-muted" style="padding:22px 22px 0;font-size:12px;line-height:1.5;color:${BASE.muted}">${esc(p.footer ?? `You are receiving this email from ${p.brand}.`)}${p.unsubscribeUrl ? ` <a class="em-muted" href="${esc(p.unsubscribeUrl)}" style="color:${BASE.muted}">Unsubscribe</a>` : ""}</td></tr></table>
</td></tr></table></body></html>`;
  const text = [p.heading, "", ...paras, ...(link && p.buttonText ? ["", `${p.buttonText}: ${link}`] : []), ...(p.unsubscribeUrl ? ["", `Unsubscribe: ${p.unsubscribeUrl}`] : [])].join("\n");
  return { html, text };
}

const mix = (a: string, b: string, k: number) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * k + parseInt(b.slice(i, i + 2), 16) * (1 - k)).toString(16).padStart(2, "0")).join("");

/** Dresses a finished email in a theme. Dark colours apply only where the reader's device and mail app are in dark mode. */
export function themedEmail(html: string, t: Theme) {
  const pairs: [string, string][] = [
    [BASE.paper, t.light.paper], [BASE.ink, t.light.ink], [BASE.body, t.light.muted], [BASE.muted, t.light.muted], [BASE.line, t.light.line], [BASE.accent, t.light.accent], [BASE.accentInk, t.light.accentInk], [BASE.tint, mix(t.light.accent, t.light.paper, 0.14)],
    [NIGHT.paper, t.dark.paper], [NIGHT.surface, t.dark.surface], [NIGHT.ink, t.dark.ink], [NIGHT.muted, t.dark.muted], [NIGHT.line, t.dark.line], [NIGHT.accent, t.fill ? t.light.accent : t.dark.accent], [NIGHT.accentInk, t.fill ? t.light.accentInk : t.dark.accentInk],
  ];
  return pairs.reduce((out, [from, to]) => out.split(from).join(to), html);
}

/** Replaces {{name}}-style placeholders and tidies empty lines. */
export const fillTemplate = (s: string, vars: Record<string, string>) =>
  s.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, k: string) => vars[k.toLowerCase()] ?? "").replace(/\n{3,}/g, "\n\n").trim();
