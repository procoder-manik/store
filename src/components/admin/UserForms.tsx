"use client";

import { useState, useTransition } from "react";
import { createStaff, setStaffPassword } from "@/app/admin/users/actions";
import { ROLES } from "@/lib/roles";

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm";

export function CreateUserForm() {
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const el = e.currentTarget;
        const f = new FormData(el);
        start(async () => {
          const r = await createStaff({ name: f.get("name"), email: f.get("email"), password: f.get("password"), role: f.get("role") });
          setMsg(r);
          if (r.ok) el.reset();
        });
      }}
      className="mt-3 grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2"
    >
      <input name="name" required maxLength={80} placeholder="Full name" aria-label="Full name" autoComplete="off" className={input} />
      <input name="email" type="email" required placeholder="Email" aria-label="Email" autoComplete="off" className={input} />
      <input name="password" type="text" required minLength={10} maxLength={72} placeholder="Password, 10 characters or more" aria-label="Password" autoComplete="new-password" className={input} />
      <select name="role" defaultValue="staff" aria-label="Role" className={input}>{ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
      {msg && <p role="status" className={`text-sm sm:col-span-2 ${msg.ok ? "text-emerald-700" : "text-[var(--madder)]"}`}>{msg.message}</p>}
      <button disabled={pending} className="w-fit rounded-pill bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-50">{pending ? "Creating..." : "Create user"}</button>
    </form>
  );
}

export function PasswordForm({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="underline">{msg || "Change password"}</button>;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const password = String(new FormData(e.currentTarget).get("password"));
        start(async () => {
          const r = await setStaffPassword({ id, password });
          setMsg(r.message);
          if (r.ok) setOpen(false);
        });
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input name="password" type="text" required minLength={10} maxLength={72} placeholder="New password" aria-label="New password" autoComplete="new-password" className="rounded-lg border border-line bg-paper px-2.5 py-1.5" />
      <button disabled={pending} className="underline">Save</button>
      <button type="button" onClick={() => setOpen(false)} className="text-muted underline">Cancel</button>
      {msg && <span className="text-[var(--madder)]">{msg}</span>}
    </form>
  );
}
