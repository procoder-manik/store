"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const field = "w-full rounded-xl border border-line bg-surface px-4 py-3 text-base md:text-sm";

/** Opened from the reset email, or from My account. Needs the session that link creates. */
export default function ResetPassword() {
  const router = useRouter();
  const [ready, setReady] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sb = createClient();
    const { data: { subscription } } = sb.auth.onAuthStateChange((_, session) => { if (session) setReady(true); });
    sb.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    const t = window.setTimeout(() => setReady((r) => r ?? false), 3000);
    return () => { subscription.unsubscribe(); window.clearTimeout(t); };
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password"));
    if (password !== String(f.get("again"))) return setError("The two passwords are different. Type them again.");
    setBusy(true);
    const { error: err } = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (err) return setError(err.message);
    router.push("/account");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-sm px-5 py-16">
      <h1 className="font-display text-3xl font-bold">Set a new password</h1>
      {ready === null && <p className="mt-4 text-sm text-muted">Checking your link...</p>}
      {ready === false && (
        <div className="mt-4 grid gap-4 text-sm text-muted">
          <p>This link has expired or was opened in a different browser. Ask for a new one and open it on this device.</p>
          <Link href="/login" className="w-fit rounded-pill bg-accent px-6 py-3 font-semibold text-accent-ink">Back to sign in</Link>
        </div>
      )}
      {ready && (
        <form onSubmit={submit} className="mt-6 grid gap-3">
          <div><label htmlFor="password" className="mb-1.5 block text-sm font-medium">New password</label><input id="password" name="password" type="password" required minLength={10} autoComplete="new-password" className={field} /><p className="mt-1.5 text-xs text-muted">Use at least 10 characters.</p></div>
          <div><label htmlFor="again" className="mb-1.5 block text-sm font-medium">Type it again</label><input id="again" name="again" type="password" required minLength={10} autoComplete="new-password" className={field} /></div>
          {error && <p role="alert" className="text-sm text-[var(--madder)]">{error}</p>}
          <button disabled={busy} className="mt-1 h-12 rounded-pill bg-accent text-sm font-semibold text-accent-ink disabled:opacity-50">{busy ? "Saving..." : "Save new password"}</button>
        </form>
      )}
    </main>
  );
}
