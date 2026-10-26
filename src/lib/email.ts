import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { SITE_URL } from "@/lib/config";

export const emailConfigured = () => !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

export type Outgoing = { to: string; subject: string; html: string; text: string };

/** Sends through Resend in batches of 100. Returns counts so a failure never throws into a customer flow. */
export async function sendEmails(msgs: Outgoing[]): Promise<{ sent: number; failed: number; error?: string }> {
  if (!emailConfigured()) return { sent: 0, failed: msgs.length, error: "Add RESEND_API_KEY and EMAIL_FROM to .env.local." };
  let sent = 0, failed = 0, error: string | undefined;
  for (let i = 0; i < msgs.length; i += 100) {
    const chunk = msgs.slice(i, i + 100);
    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify(chunk.map((m) => ({ from: process.env.EMAIL_FROM, to: [m.to], subject: m.subject, html: m.html, text: m.text }))),
      });
      if (res.ok) sent += chunk.length;
      else { failed += chunk.length; error = (await res.text()).slice(0, 160); }
    } catch {
      failed += chunk.length;
      error = "Could not reach the email service.";
    }
  }
  return { sent, failed, error };
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
