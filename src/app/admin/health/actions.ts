"use server";

import { requireAdmin } from "@/lib/admin";
import { emailConfigured, sendEmails } from "@/lib/email";
import { brandedEmail } from "@/lib/email-html";
import { SITE_URL } from "@/lib/config";
import { getPublicSettings } from "@/lib/settings";

export async function sendTestEmail(): Promise<{ ok: boolean; message: string }> {
  const { user } = await requireAdmin("email.healthtest");
  if (!process.env.RESEND_API_KEY) return { ok: false, message: "RESEND_API_KEY is missing in .env.local. Create a free account at resend.com, make an API key, paste it, and restart the server." };
  if (!process.env.EMAIL_FROM) return { ok: false, message: "EMAIL_FROM is missing in .env.local. For testing use: EMAIL_FROM=onboarding@resend.dev  For real customers use an address on your own verified domain." };
  if (!emailConfigured() || !user.email) return { ok: false, message: "Email is not set up." };
  const { brand } = await getPublicSettings();
  const m = brandedEmail({ brand: brand.name, logo: brand.logo, siteUrl: SITE_URL, heading: "Your email works", body: "This is a test from your store. If you can read this, thank-you and order emails can be sent.", footer: "Test message." });
  const r = await sendEmails([{ to: user.email, subject: "Test email from your store", ...m }], "test");
  return r.sent ? { ok: true, message: `Sent to ${user.email}. Check your inbox and spam folder.` } : { ok: false, message: r.error ?? "Could not send." };
}
