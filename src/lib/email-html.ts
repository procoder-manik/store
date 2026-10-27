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

/** One branded layout for every email. Admin text is escaped, never trusted as HTML. */
export function brandedEmail(p: EmailParts): { html: string; text: string } {
  const accent = "#1f6f78";
  const link = url(p.buttonUrl, p.siteUrl);
  const img = url(p.imageUrl, p.siteUrl);
  const paras = p.body.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  const html = `<!doctype html><html><body style="margin:0;background:#f5f6f8;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#15171c">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="padding:22px 28px;border-bottom:1px solid #e3e6eb;font-size:20px;font-weight:700;color:${accent}">${p.logo && p.logo.startsWith("https://") ? `<img src="${esc(p.logo)}" alt="${esc(p.brand)}" height="36" style="display:block;height:36px;max-width:200px">` : esc(p.brand)}</td></tr>
${img ? `<tr><td><img src="${esc(img)}" alt="" width="560" style="display:block;width:100%;height:auto"></td></tr>` : ""}
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.25">${esc(p.heading)}</h1>
${paras.map((x) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3a3f48">${esc(x).replace(/\n/g, "<br>")}</p>`).join("")}
${link && p.buttonText ? `<p style="margin:22px 0 4px"><a href="${esc(link)}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 28px;border-radius:999px">${esc(p.buttonText)}</a></p>` : ""}
</td></tr>
<tr><td style="padding:18px 28px;background:#f5f6f8;font-size:12px;line-height:1.5;color:#6b7280">${esc(p.footer ?? `You are receiving this email from ${p.brand}.`)}${p.unsubscribeUrl ? ` <a href="${esc(p.unsubscribeUrl)}" style="color:#6b7280">Unsubscribe</a>` : ""}</td></tr>
</table></td></tr></table></body></html>`;
  const text = [p.heading, "", ...paras, ...(link && p.buttonText ? ["", `${p.buttonText}: ${link}`] : []), ...(p.unsubscribeUrl ? ["", `Unsubscribe: ${p.unsubscribeUrl}`] : [])].join("\n");
  return { html, text };
}

/** Replaces {{name}}-style placeholders and tidies empty lines. */
export const fillTemplate = (s: string, vars: Record<string, string>) =>
  s.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, k: string) => vars[k.toLowerCase()] ?? "").replace(/\n{3,}/g, "\n\n").trim();
