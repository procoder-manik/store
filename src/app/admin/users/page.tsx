import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLES, roleName } from "@/lib/roles";
import { CreateUserForm, PasswordForm } from "@/components/admin/UserForms";
import { removeStaff, resetStaffMfa, setStaffRole } from "./actions";

export const metadata = { title: "Users" };

type Row = { id: string; full_name: string | null; role: string };

export default async function Users() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user?.id ?? "").maybeSingle();
  if (me?.role !== "super_admin") redirect("/admin");

  const db = createAdminClient();
  const [{ data: rows }, { data: auth }] = await Promise.all([
    db.from("profiles").select("id, full_name, role").in("role", ["support", "staff", "manager", "super_admin"]).order("role"),
    db.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const accounts = new Map((auth?.users ?? []).map((u) => [u.id, u]));

  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Users</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">Add the people who work on your store and choose what each one can do.</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((r) => <div key={r.id} className="rounded-xl border border-line bg-surface p-4"><p className="text-sm font-medium">{r.name}</p><p className="mt-1 text-xs text-muted">{r.about}</p></div>)}
      </div>

      <section className="mt-8 max-w-3xl">
        <h2 className="font-display text-lg font-semibold">Add a user</h2>
        <CreateUserForm />
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Your team</h2>
        <ul className="mt-3 grid gap-3">
          {((rows ?? []) as Row[]).map((r) => {
            const a = accounts.get(r.id);
            const twoStep = (a?.factors ?? []).some((f) => f.status === "verified");
            const self = r.id === user?.id;
            return (
              <li key={r.id} className="grid gap-3 rounded-xl border border-line bg-surface p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{r.full_name || a?.email}{self && <span className="ml-2 rounded-pill bg-paper px-2 py-0.5 text-[11px] font-normal text-muted">You</span>}</p>
                    <p className="break-all text-xs text-muted">{a?.email}</p>
                    <p className="mt-1 text-xs text-muted">{roleName(r.role)}. Two-step {twoStep ? "on" : "not set up yet"}. Last sign-in {a?.last_sign_in_at ? new Date(a.last_sign_in_at).toLocaleDateString("en-GB") : "never"}.</p>
                  </div>
                  {!self && (
                    <form action={setStaffRole} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={r.id} />
                      <select name="role" defaultValue={r.role} aria-label={`Role for ${a?.email}`} className="rounded-xl border border-line bg-paper px-3 py-2 text-sm">{ROLES.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
                      <button className="rounded-pill border border-line px-4 py-2 text-xs font-medium hover:bg-paper">Save role</button>
                    </form>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 border-t border-line pt-3 text-xs">
                  <PasswordForm id={r.id} />
                  {twoStep && <form action={resetStaffMfa}><input type="hidden" name="id" value={r.id} /><button className="underline">Reset two-step</button></form>}
                  {!self && <form action={removeStaff}><input type="hidden" name="id" value={r.id} /><button className="text-[var(--madder)] underline">Remove access</button></form>}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
