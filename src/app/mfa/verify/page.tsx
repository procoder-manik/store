"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MfaVerify() {
  const router = useRouter();
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sb = createClient();
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { router.replace("/login?next=/mfa/verify"); return; }
      const { data: fs } = await sb.auth.mfa.listFactors();
      const f = fs?.totp?.find((x) => x.status === "verified");
      if (!f) { router.replace("/mfa/setup"); return; }
      setFactorId(f.id);
    })();
  }, [router]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const sb = createClient();
    const { data: ch, error: ce } = await sb.auth.mfa.challenge({ factorId });
    if (ce || !ch) { setBusy(false); setError(ce?.message ?? "Could not check the code."); return; }
    const { error: ve } = await sb.auth.mfa.verify({ factorId, challengeId: ch.id, code: code.trim() });
    setBusy(false);
    if (ve) { setError("That code is not correct. Use the newest code from your app."); return; }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-sm px-5 py-12">
      <h1 className="font-display text-2xl font-semibold">Enter your code</h1>
      <p className="mt-2 text-sm text-muted">Open your authenticator app and type the 6 digit code for this store.</p>
      <form onSubmit={verify} className="mt-6 grid gap-3">
        <label htmlFor="code" className="sr-only">6 digit code</label>
        <input id="code" autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="w-40 rounded-xl border border-line bg-surface px-4 py-3 text-center text-lg tracking-widest" />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={busy || !factorId || code.length !== 6} className="w-fit rounded-pill bg-accent px-7 py-3 text-sm font-semibold text-accent-ink disabled:opacity-50">{busy ? "Checking..." : "Continue"}</button>
      </form>
    </main>
  );
}
