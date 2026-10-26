import { createClient } from "@/lib/supabase/server";

type Row = { id: string; action: string; created_at: string; meta: { email?: string | null; ip?: string } | null };

export default async function Audit() {
  const supabase = await createClient();
  const { data } = await supabase.from("audit_logs").select("id, action, created_at, meta").order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as Row[];
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Audit log</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">Who changed what in the admin panel, with the time and the internet address. The latest 200 actions are shown. Entries are written by the server, so they cannot be edited from here.</p>
      <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-line text-xs text-muted"><tr><th className="p-3 font-medium">When</th><th className="p-3 font-medium">Who</th><th className="p-3 font-medium">Action</th><th className="p-3 font-medium">Address</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={4} className="p-6 text-muted">Nothing recorded yet.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="whitespace-nowrap p-3 text-muted">{new Date(r.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td className="p-3">{r.meta?.email ?? "Unknown"}</td>
                <td className="p-3 font-mono text-xs">{r.action}</td>
                <td className="p-3 text-muted">{r.meta?.ip ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
