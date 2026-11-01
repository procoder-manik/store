"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const field = "w-full rounded-xl border border-line bg-surface px-4 py-3 text-base md:text-sm";
const TITLES = { in: "Sign in", up: "Create your account", forgot: "Reset your password" };

/** Only same-site paths are allowed, so a crafted link cannot send someone to another website after signing in. */
function safePath(n: string | null) {
  return n && /^\/(?![/\\])/.test(n) && !/[\\\r\n]/.test(n) ? n : "/";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const next = safePath(params.get("next"));

  function switchTo(m: typeof mode) {
    setMode(m);
    setError("");
    setNote("");
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNote("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    const password = String(f.get("password") ?? "");
    const supabase = createClient();
    try {
      if (mode === "forgot") {
        // The answer is the same whether or not the email has an account, so nobody can test who shops here.
        await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        setNote("If that email has an account, a reset link is on its way. Check your inbox and spam folder.");
        return;
      }
      if (mode === "in") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) return setError(err.status === 429 ? "Too many tries. Wait a few minutes, then try again." : "That email and password do not match. Check them or reset your password.");
      } else {
        const { data, error: err } = await supabase.auth.signUp({ email, password, options: { data: { full_name: String(f.get("name") ?? "") } } });
        if (err) return setError(err.message);
        if (!data.session) return setNote("Almost done. Open the link we sent to your email to confirm your account.");
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-[calc(100dvh-4rem)] md:grid-cols-2">
      <div aria-hidden className="relative hidden flex-col justify-end overflow-hidden bg-accent p-12 text-accent-ink md:flex">
        <p className="font-display text-[clamp(3rem,6vw,5.5rem)] font-normal leading-[0.98]">Good things, carried to your door.</p>
      </div>
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-bold">{TITLES[mode]}</h1>
          {mode === "forgot" && <p className="mt-2 text-sm text-muted">Enter your email and we will send you a link to set a new password.</p>}
          <form onSubmit={submit} className="mt-6 grid gap-3">
            {mode === "up" && <div><label htmlFor="name" className="mb-1.5 block text-sm font-medium">Full name</label><input id="name" name="name" required autoComplete="name" className={field} /></div>}
            <div><label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label><input id="email" name="email" type="email" required autoComplete="email" inputMode="email" className={field} /></div>
            {mode !== "forgot" && (
              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                  {mode === "in" && <button type="button" onClick={() => switchTo("forgot")} className="text-xs text-muted underline hover:text-ink">Forgot password?</button>}
                </div>
                <div className="relative">
                  <input id="password" name="password" type={show ? "text" : "password"} required minLength={mode === "up" ? 10 : 1} autoComplete={mode === "in" ? "current-password" : "new-password"} className={`${field} pr-12`} />
                  <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted hover:text-ink">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                </div>
                {mode === "up" && <p className="mt-1.5 text-xs text-muted">Use at least 10 characters.</p>}
              </div>
            )}
            {error && <p role="alert" className="text-sm text-[var(--madder)]">{error}</p>}
            {note && <p role="status" className="rounded-xl bg-accent/10 p-3 text-sm">{note}</p>}
            <button disabled={busy} className="mt-1 h-12 rounded-pill bg-accent text-sm font-semibold text-accent-ink transition active:scale-[0.99] disabled:opacity-50">{busy ? "Please wait..." : mode === "forgot" ? "Send reset link" : mode === "in" ? "Sign in" : "Create account"}</button>
          </form>
          <div className="mt-5 grid gap-2 text-sm text-muted">
            {mode === "in" && <button onClick={() => switchTo("up")} className="w-fit underline hover:text-ink">New here? Create an account</button>}
            {mode !== "in" && <button onClick={() => switchTo("in")} className="w-fit underline hover:text-ink">Back to sign in</button>}
            <Link href="/track" className="w-fit underline hover:text-ink">Track an order without signing in</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
