import Link from "next/link";
import { AutoEmailForm } from "@/components/admin/AutoEmailForm";
import { AUTO_EMAILS, loadAutoEmails } from "@/lib/auto-emails";
import { getPublicSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AutomaticEmails() {
  const [all, { brand }] = await Promise.all([loadAutoEmails(), getPublicSettings()]);
  let saved: Record<string, unknown> = {};
  try { saved = ((await createAdminClient().from("site_settings").select("value").eq("key", "auto_emails").maybeSingle()).data?.value ?? {}) as Record<string, unknown>; } catch { /* none */ }
  const configured = !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
  return (
    <>
      <Link href="/admin/emails" className="text-sm text-muted hover:text-ink">Back to Email marketing</Link>
      <h1 className="mt-2 font-display text-2xl font-semibold">Automatic emails</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">These are sent for you when something happens: someone writes to you, joins your list, or an order changes. Change the wording and button of each one, see a live preview, and send a test to yourself. They all use your logo and brand name.</p>
      {!configured && <p className="mt-4 max-w-2xl rounded-xl border border-line bg-paper p-4 text-sm">Sending is off. Add <code>RESEND_API_KEY</code> and <code>EMAIL_FROM</code> to <code>.env.local</code> and restart the server. Then open Admin, Health check, to test.</p>}
      <div className="mt-6 grid max-w-5xl gap-3">
        {AUTO_EMAILS.map((d) => <AutoEmailForm key={d.key} k={d.key} title={d.label} when={d.when} vars={d.vars} initial={all[d.key]} brand={brand.name} logo={brand.logo} changed={!!saved[d.key]} />)}
      </div>
    </>
  );
}
