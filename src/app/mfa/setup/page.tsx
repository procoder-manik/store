"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MfaSetup() {
  const router = useRouter();
  const started = useRef(false);
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const sb = createClient();
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { router.replace("/login?next=/mfa/setup"); return; }
      const { data: fs } = await sb.auth.mfa.listFactors();
      if (fs?.totp?.some((f) => f.status === "verified")) { router.replace("/mfa/verify"); return; }
      for (const f of fs?.all ?? []) if (f.status === "unverified") await sb.auth.mfa.unenroll({ factorId: f.id });
      const { data, error: err } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: `Authenticator ${Date.now()}` });
      if (err || !data) { setError(err?.message ?? "Could not start setup."); return; }
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
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
    <main className="mx-auto max-w-md px-5 py-12">
      <h1 className="font-display text-2xl font-semibold">Set up two-step verification</h1>
      <p className="mt-2 text-sm text-muted">The admin panel needs a code from an authenticator app (Google Authenticator, Microsoft Authenticator or Authy) each time you sign in. This protects your store even if your password leaks.</p>
      <ol className="mt-6 grid gap-5 text-sm">
        <li>
          <p className="font-medium">1. Scan this code with your app</p>
          {qr ? <img src={qr} alt="Authenticator setup code" className="mt-3 h-44 w-44 rounded-xl border border-line bg-white p-2" /> : !error && <p className="mt-3 text-muted">Preparing...</p>}
          {secret && <p className="mt-2 text-xs text-muted">Cannot scan? Type this key into your app: <span className="select-all break-all font-mono text-ink">{secret}</span></p>}
        </li>
        <li>
          <form onSubmit={verify} className="grid gap-3">
            <label htmlFor="code" className="font-medium">2. Enter the 6 digit code</label>
            <input id="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="w-40 rounded-xl border border-line bg-surface px-4 py-3 text-center text-lg tracking-widest" />
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button disabled={busy || !factorId || code.length !== 6} className="w-fit rounded-pill bg-accent px-7 py-3 text-sm font-semibold text-accent-ink disabled:opacity-50">{busy ? "Checking..." : "Turn on verification"}</button>
          </form>
        </li>
      </ol>
    </main>
  );
}
