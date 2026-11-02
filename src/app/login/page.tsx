"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const field = "w-full rounded-xl border border-line bg-surface px-4 py-3 text-base md:text-sm";
const TITLES = { in: "Sign in", up: "Create your account", forgot: "Reset your password" };

/** Only same-site paths are allowed, so a crafted link cannot send someone to another website after signing in. */
function safePath(n: string | null) {
  return n && /^\/(?![/\\])/.test(n) && !/[\\\r\n]/.test(n) ? n : "/";
}

const SOCIAL = [{ id: "google" as const, name: "Google" }, { id: "facebook" as const, name: "Facebook" }];

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.1 5.5c4.3-4 6.7-9.8 6.7-16.9z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.4-4.9 2.3-8.8 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [error, setError] = useState(params.get("error") === "social" ? "Sign in did not finish. Please try again, or use your email." : "");
  const [social, setSocial] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const next = safePath(params.get("next"));

  // A provider shows up here by itself once it is switched on in Supabase, so nobody sees a button that cannot work.
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;
    fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
      .then((r) => r.json())
      .then((d: { external?: Record<string, boolean> }) => setSocial(SOCIAL.filter((p) => d.external?.[p.id]).map((p) => p.id)))
      .catch(() => setSocial([]));
  }, []);

  async function continueWith(provider: (typeof SOCIAL)[number]["id"]) {
    setError("");
    setBusy(true);
    const { error: err } = await createClient().auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
    if (err) { setError("Could not start sign in. Please try again."); setBusy(false); }
  }

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
          {mode !== "forgot" && social.length > 0 && (
            <>
              <div className="mt-6 grid gap-2.5">
                {SOCIAL.filter((p) => social.includes(p.id)).map((p) => (
                  <button key={p.id} type="button" disabled={busy} onClick={() => continueWith(p.id)} className="flex h-12 w-full items-center justify-center gap-3 rounded-pill border border-line bg-surface text-sm font-semibold transition hover:bg-paper active:scale-[0.99] disabled:opacity-50">{p.id === "google" ? <GoogleMark /> : <FacebookMark />} Continue with {p.name}</button>
                ))}
              </div>
              <p className="mt-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />or use your email<span className="h-px flex-1 bg-line" /></p>
            </>
          )}
          <form onSubmit={submit} className={`${mode !== "forgot" && social.length > 0 ? "mt-5" : "mt-6"} grid gap-3`}>
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
