import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CampaignControls } from "@/components/admin/CampaignControls";

export default async function Emails() {
  const supabase = await createClient();
  const [{ data: tpls, error }, { data: camps }] = await Promise.all([
    supabase.from("email_templates").select("id, name, subject").order("created_at", { ascending: false }),
    supabase.from("email_campaigns").select("id, name, audience, sent_count, failed_count, created_at").order("created_at", { ascending: false }).limit(10),
  ]);
  const configured = !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Email marketing</h1>
        <Link href="/admin/emails/new" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">New template</Link>
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
