import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { SITE_URL } from "@/lib/config";

export const emailConfigured = () => !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

export type Outgoing = { to: string; subject: string; html: string; text: string };

/** Turns the email service's raw error into a sentence the store owner can act on. */
export function explainEmailError(raw: string): string {
  const t = raw.toLowerCase();
  if (t.includes("own email address") || t.includes("testing emails")) return "Your Resend account is still in testing mode, so it can only send to the email you signed up with. Verify your own domain at resend.com/domains, then set EMAIL_FROM to an address on that domain, like hello@yourdomain.com.";
  if (t.includes("domain is not verified") || t.includes("not verified")) return "The domain in EMAIL_FROM is not verified in Resend. Open resend.com/domains, add your domain and add the DNS records it shows.";
  if (t.includes("api key is invalid") || t.includes("invalid api key") || t.includes("restricted_api_key") || t.includes("401")) return "RESEND_API_KEY is wrong or has no permission to send. Create a new key with Sending access at resend.com/api-keys.";
  if (t.includes("invalid `from`") || t.includes("from field") || t.includes("invalid from")) return "EMAIL_FROM is not a valid sender. Use the form hello@yourdomain.com or Your Shop <hello@yourdomain.com>.";
  if (t.includes("rate") && t.includes("limit")) return "Too many emails too quickly. Try again in a minute.";
  return raw.slice(0, 220);
}

/** Sends through Resend in batches of 100. Never throws into a customer flow, and records every result in the email log. */
export async function sendEmails(msgs: Outgoing[], kind = "other"): Promise<{ sent: number; failed: number; error?: string }> {
  if (!emailConfigured()) {
    await log(msgs, kind, "failed", "Email is not set up. Add RESEND_API_KEY and EMAIL_FROM to .env.local.");
    return { sent: 0, failed: msgs.length, error: "Add RESEND_API_KEY and EMAIL_FROM to .env.local." };
  }
  let sent = 0, failed = 0, error: string | undefined;
  for (let i = 0; i < msgs.length; i += 100) {
    const chunk = msgs.slice(i, i + 100);
    try {
      const payload = chunk.map((m) => ({ from: process.env.EMAIL_FROM, to: [m.to], subject: m.subject, html: m.html, text: m.text }));
      const res = await fetch(payload.length === 1 ? "https://api.resend.com/emails" : "https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify(payload.length === 1 ? payload[0] : payload),
      });
      if (res.ok) { sent += chunk.length; await log(chunk, kind, "sent"); }
      else {
        const raw = await res.text();
        let msg = raw;
        try { const j = JSON.parse(raw) as { message?: string }; msg = j.message ?? raw; } catch { /* plain text */ }
        failed += chunk.length;
        error = explainEmailError(`${res.status} ${msg}`);
        await log(chunk, kind, "failed", error);
        console.error("[email] send failed:", res.status, msg);
      }
    } catch (e) {
      failed += chunk.length;
      error = "Could not reach the email service. Check the internet connection of the server.";
      await log(chunk, kind, "failed", error);
      console.error("[email] network error:", (e as Error).message);
    }
  }
  return { sent, failed, error };
}

async function log(msgs: Outgoing[], kind: string, status: "sent" | "failed", error?: string) {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    await createAdminClient().from("email_log").insert(msgs.map((m) => ({ to_email: m.to, subject: m.subject.slice(0, 200), kind, status, error: error ?? null })));
  } catch {
    // The log is a convenience. It must never break sending.
  }
}

const secret = () => process.env.EMAIL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export function unsubToken(email: string) {
  if (!secret()) throw new Error("Set EMAIL_SECRET in .env.local");
  return createHmac("sha256", secret()).update(email.toLowerCase()).digest("hex").slice(0, 32);
}
export function verifyUnsub(email: string, token: string) {
  try {
    const a = Buffer.from(unsubToken(email));
    const b = Buffer.from(token);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
export const unsubUrl = (email: string) => `${SITE_URL}/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubToken(email)}`;
