import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CampaignControls } from "@/components/admin/CampaignControls";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function Emails() {
  const supabase = await createClient();
  const [{ data: tpls, error }, { data: camps }] = await Promise.all([
    supabase.from("email_templates").select("id, name, subject").order("created_at", { ascending: false }),
    supabase.from("email_campaigns").select("id, name, audience, sent_count, failed_count, created_at").order("created_at", { ascending: false }).limit(10),
  ]);
  const configured = !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
  let log: { id: string; to_email: string; subject: string; kind: string; status: string; error: string | null; created_at: string }[] = [];
  try { log = ((await createAdminClient().from("email_log").select("*").order("created_at", { ascending: false }).limit(8)).data ?? []) as typeof log; } catch { /* log not set up */ }
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Email marketing</h1>
        <span className="flex gap-2"><Link href="/admin/emails/automatic" className="rounded-pill border border-line px-5 py-2 text-sm font-medium hover:bg-surface">Automatic emails</Link><Link href="/admin/emails/new" className="rounded-pill bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">New template</Link></span>
      </div>
      <p className="mt-1 max-w-2xl text-sm text-muted">Every email uses your brand name and colors automatically. Write the message, preview it, send yourself a test, then send it to an audience. Each email includes an unsubscribe link.</p>
      {!configured && <p className="mt-4 max-w-2xl rounded-xl border border-line bg-paper p-4 text-sm">Sending is off. Add <code>RESEND_API_KEY</code> and <code>EMAIL_FROM</code> to your <code>.env.local</code> file and restart the server. Order confirmation emails use the same setup.</p>}
      {error && <p className="mt-4 text-sm text-muted">Run supabase-0006-crm-email.sql in the Supabase SQL Editor, then refresh.</p>}
      <ul className="mt-6 grid max-w-3xl gap-3">
        {!error && (tpls ?? []).length === 0 && <li className="rounded-xl border border-line bg-surface p-5 text-sm text-muted">No templates yet. Create your first one.</li>}
        {(tpls ?? []).map((t) => (
          <li key={t.id} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-3"><span><Link href={`/admin/emails/${t.id}`} className="font-medium hover:underline">{t.name}</Link><span className="block text-xs text-muted">{t.subject}</span></span><Link href={`/admin/emails/${t.id}`} className="text-xs underline">Edit</Link></div>
            <CampaignControls templateId={t.id} />
          </li>
        ))}
      </ul>
      {log.length > 0 && (
        <section className="mt-10 max-w-3xl">
          <h2 className="font-display text-lg font-semibold">Latest emails sent by the store</h2>
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-surface text-sm">
            {log.map((m) => <li key={m.id} className="p-4"><div className="flex justify-between gap-3"><span className="min-w-0 truncate">{m.subject}<span className="block truncate text-xs text-muted">to {m.to_email}</span></span><span className={`shrink-0 text-xs font-medium ${m.status === "sent" ? "text-emerald-700" : "text-red-600"}`}>{m.status === "sent" ? "Sent" : "Failed"}</span></div>{m.error && <p className="mt-2 rounded-lg bg-paper p-3 text-xs">{m.error}</p>}</li>)}
          </ul>
        </section>
      )}
      {(camps ?? []).length > 0 && (
        <section className="mt-10 max-w-3xl">
          <h2 className="font-display text-lg font-semibold">Recent sends</h2>
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-surface text-sm">
            {(camps ?? []).map((c) => <li key={c.id} className="flex justify-between gap-3 p-4"><span>{c.name}<span className="block text-xs capitalize text-muted">{c.audience}</span></span><span className="text-right">{c.sent_count} sent{c.failed_count > 0 ? `, ${c.failed_count} failed` : ""}<span className="block text-xs text-muted">{new Date(c.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}</span></span></li>)}
          </ul>
        </section>
      )}
    </>
  );
}
