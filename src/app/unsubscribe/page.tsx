import type { Metadata } from "next";
import Link from "next/link";
import { verifyUnsub } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ e?: string; t?: string }> }) {
  const { e = "", t = "" } = await searchParams;
  const email = e.trim().toLowerCase();
  let ok = false;
  if (email && t && verifyUnsub(email, t)) {
    try {
      const db = createAdminClient();
      await db.from("email_optouts").upsert({ email });
      await db.from("leads").update({ unsubscribed: true }).eq("email", email);
      ok = true;
    } catch { /* shown below */ }
  }
  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <h1 className="font-display text-2xl font-semibold">{ok ? "You are unsubscribed" : "This link is not valid"}</h1>
      <p className="mt-3 text-sm text-muted">{ok ? "You will not get marketing emails from us again. Order updates for orders you place can still be sent." : "The unsubscribe link looks incomplete or has expired. Use the link from the latest email."}</p>
      <Link href="/" className="mt-6 inline-block rounded-pill bg-accent px-6 py-3 text-sm font-semibold text-accent-ink">Back to the shop</Link>
    </main>
  );
}
