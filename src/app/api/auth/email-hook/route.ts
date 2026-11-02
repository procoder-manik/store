import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { brandedEmail } from "@/lib/email-html";
import { sendEmails } from "@/lib/email";
import { SITE_URL } from "@/lib/config";
import { getPublicSettings } from "@/lib/settings";

type Payload = { user?: { email?: string; new_email?: string }; email_data?: { token_hash?: string; redirect_to?: string; email_action_type?: string; site_url?: string } };

const COPY: Record<string, { subject: string; heading: string; body: string; button: string }> = {
  signup: { subject: "Confirm your email", heading: "Welcome. One last step.", body: "Tap the button to confirm your email and finish creating your account.", button: "Confirm my email" },
  recovery: { subject: "Set a new password", heading: "Set a new password", body: "Tap the button to choose a new password. If you did not ask for this, you can ignore this email and your password stays the same.", button: "Set a new password" },
  magiclink: { subject: "Your sign in link", heading: "Sign in", body: "Tap the button to sign in. The link works once and expires soon.", button: "Sign in" },
  invite: { subject: "You have been invited", heading: "You are invited", body: "Tap the button to accept your invitation and set up your account.", button: "Accept invitation" },
  email_change: { subject: "Confirm your new email", heading: "Confirm your new email", body: "Tap the button to confirm this as the new email for your account.", button: "Confirm new email" },
};

/** Checks the signature Supabase puts on each request, so nobody else can make the store send mail. */
function verified(req: Request, raw: string) {
  const secret = process.env.SEND_EMAIL_HOOK_SECRET?.replace(/^v1,whsec_/, "");
  const id = req.headers.get("webhook-id"), time = req.headers.get("webhook-timestamp"), sent = req.headers.get("webhook-signature");
  if (!secret || !id || !time || !sent) return false;
  if (Math.abs(Date.now() / 1000 - Number(time)) > 300) return false;
  const want = createHmac("sha256", Buffer.from(secret, "base64")).update(`${id}.${time}.${raw}`).digest();
  return sent.split(" ").some((part) => {
    const got = Buffer.from(part.replace(/^v1,/, ""), "base64");
    return got.length === want.length && timingSafeEqual(got, want);
  });
}

const fail = (status: number, message: string) => NextResponse.json({ error: { http_code: status, message } }, { status });

/**
 * Supabase hands its account emails to this route, so they go out from the store's own address, in the active theme.
 * It is used only once the hook is switched on in Supabase, under Authentication, Hooks.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verified(req, raw)) return fail(401, "Bad signature");
  let p: Payload;
  try { p = JSON.parse(raw) as Payload; } catch { return fail(400, "Bad request"); }
  const d = p.email_data;
  const type = d?.email_action_type ?? "";
  const to = type === "email_change" ? p.user?.new_email ?? p.user?.email : p.user?.email;
  const copy = COPY[type];
  if (!to || !d?.token_hash || !copy) return fail(400, "Unsupported email");

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const link = `${base}/auth/v1/verify?token=${encodeURIComponent(d.token_hash)}&type=${encodeURIComponent(type)}&redirect_to=${encodeURIComponent(d.redirect_to || SITE_URL)}`;
  const { brand } = await getPublicSettings();
  const mail = brandedEmail({ brand: brand.name, logo: brand.logo, heading: copy.heading, body: copy.body, buttonText: copy.button, buttonUrl: link, siteUrl: SITE_URL, footer: `If this was not you, you can ignore this email. ${brand.name}.` });
  const r = await sendEmails([{ to, subject: `${copy.subject} | ${brand.name}`, ...mail }], "account");
  if (r.failed) return fail(500, r.error ?? "Could not send");
  return NextResponse.json({});
}
