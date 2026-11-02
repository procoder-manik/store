"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Heart, Loader2, Lock, Mail, PackageCheck, Sparkles, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const SOCIAL = [{ id: "google" as const, name: "Google" }, { id: "facebook" as const, name: "Facebook" }];
type Mode = "in" | "up" | "forgot";
type Shelf = { name: string; image: string }[];

const HEAD: Record<Mode, { title: string; sub: string }> = {
  in: { title: "Welcome back", sub: "Sign in to see your orders and your saved things." },
  up: { title: "Create your account", sub: "It takes a minute. Then checkout is faster and every order is easy to find." },
  forgot: { title: "Reset your password", sub: "Enter your email and we will send you a link to set a new one." },
};

const PERKS = [
  { icon: PackageCheck, text: "See every order and where it is" },
  { icon: Heart, text: "Keep the pieces you love in one place" },
  { icon: Sparkles, text: "First to know about pre-orders and offers" },
];

/** Only same-site paths are allowed, so a crafted link cannot send someone to another website after signing in. */
function safePath(n: string | null) {
  return n && /^\/(?![/\\])/.test(n) && !/[\\\r\n]/.test(n) ? n : "/";
}

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

function Boat({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path d="M5 18.5h22c-1.6 4.6-5.6 7-11 7s-9.4-2.4-11-7Z" fill="var(--gold)" />
      <path d="M15.2 6v11H7.8c1.6-3.8 4.4-7.8 7.4-11Zm1.8 3.5c2.4 2 4.6 4.8 5.8 7.5H17V9.5Z" fill="var(--gold)" />
    </svg>
  );
}

/** 0 to 4. Length counts most, then a mix of kinds of characters. */
function strength(pw: string) {
  if (!pw) return 0;
  if (pw.length < 10) return 1;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  return pw.length >= 14 && kinds >= 3 ? 4 : kinds >= 3 ? 3 : 2;
}
const STRENGTH_LABEL = ["", "Too short, use at least 10 characters", "Okay", "Good", "Strong"];

const glow = "radial-gradient(65% 55% at 85% 5%, color-mix(in srgb, var(--accent-ink) 14%, transparent), transparent 70%), radial-gradient(55% 45% at 5% 100%, color-mix(in srgb, var(--gold) 20%, transparent), transparent 70%), var(--accent)";
const fieldBox = "peer w-full rounded-xl border border-line bg-surface py-3.5 pl-11 pr-4 text-base outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/20 md:text-sm";
const icon = "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted transition peer-focus:text-accent";

export function LoginView({ shelf }: { brand: string; logo: string; shelf: Shelf }) {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>("in");
  const [error, setError] = useState(params.get("error") === "social" ? "Sign in did not finish. Please try again, or use your email." : "");
  const [social, setSocial] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState("");
  const next = safePath(params.get("next"));
  const score = strength(pw);

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

  function switchTo(m: Mode) {
    setMode(m);
    setError("");
    setNote("");
    setPw("");
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

  const head = HEAD[mode];
  const hasSocial = mode !== "forgot" && social.length > 0;

  return (
    <main className="grid min-h-[calc(100dvh-4rem)] md:grid-cols-[1.05fr_1fr]">
      {/* The shop window: real products on the brand's own colour. Only on wide screens. */}
      <aside aria-hidden className="relative hidden flex-col justify-between gap-10 overflow-hidden p-10 text-accent-ink md:flex lg:p-14" style={{ background: glow }}>
        <div className="my-auto">
          <p className="login-in font-display text-[clamp(2.6rem,4.6vw,4.6rem)] leading-[1] [--d:0.05s]">Good things, carried to your door.</p>
          {shelf.length > 0 && (
            <div className="relative mx-auto mt-10 h-56 max-w-md lg:h-72">
              {shelf.map((p, i) => (
                <img key={p.image} src={p.image} alt="" loading="eager" className={`login-in absolute bottom-0 h-full w-auto max-w-[46%] object-contain drop-shadow-[0_22px_26px_rgba(0,0,0,0.45)] ${i === 0 ? "left-0 -rotate-6 scale-90" : i === 1 ? "left-1/2 z-10 -translate-x-1/2 scale-110" : "right-0 rotate-6 scale-90"}`} style={{ ["--d" as string]: `${0.2 + i * 0.12}s` }} />
              ))}
            </div>
          )}
        </div>
        <ul className="grid gap-3 text-sm">
          {PERKS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-current/25"><Icon size={15} className="text-[var(--gold)]" /></span>{text}</li>
          ))}
        </ul>
      </aside>

      {/* On a phone the same colour sits as a short band above the form. */}
      <div aria-hidden className="flex items-center gap-3 px-5 pb-12 pt-6 text-accent-ink md:hidden" style={{ background: glow }}>
        <Boat size={34} />
        <p className="font-display text-[1.65rem] leading-[1.05]">Good things, carried to your door.</p>
      </div>

      <section className="flex items-start justify-center px-5 pb-12 md:items-center md:py-14">
        <div className="login-in -mt-6 w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.35)] md:mt-0 md:border-0 md:bg-transparent md:p-0 md:shadow-none">
          {mode !== "forgot" && (
            <div role="tablist" aria-label="Sign in or create an account" className="mb-6 grid grid-cols-2 rounded-pill border border-line bg-paper p-1 text-sm font-semibold">
              {(["in", "up"] as const).map((m) => (
                <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => switchTo(m)} className={`rounded-pill py-2.5 transition ${mode === m ? "bg-accent text-accent-ink shadow" : "text-muted hover:text-ink"}`}>{m === "in" ? "Sign in" : "Create account"}</button>
              ))}
            </div>
          )}
          <h1 className="font-display text-3xl font-semibold leading-tight md:text-4xl">{head.title}</h1>
          <p className="mt-2 text-sm text-muted">{head.sub}</p>

          {hasSocial && (
            <>
              <div className="mt-6 grid gap-2.5">
                {SOCIAL.filter((p) => social.includes(p.id)).map((p) => (
                  <button key={p.id} type="button" disabled={busy} onClick={() => continueWith(p.id)} className="flex h-12 w-full items-center justify-center gap-3 rounded-pill border border-line bg-surface text-sm font-semibold transition hover:border-ink/40 hover:bg-paper active:scale-[0.99] disabled:opacity-50">{p.id === "google" ? <GoogleMark /> : <FacebookMark />} Continue with {p.name}</button>
                ))}
              </div>
              <p className="mt-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />or use your email<span className="h-px flex-1 bg-line" /></p>
            </>
          )}

          <form onSubmit={submit} className={`${hasSocial ? "mt-5" : "mt-6"} grid gap-3.5`}>
            {mode === "up" && (
              <div className="relative">
                <label htmlFor="name" className="sr-only">Full name</label>
                <input id="name" name="name" required autoComplete="name" placeholder="Full name" className={fieldBox} />
                <User size={17} className={icon} />
              </div>
            )}
            <div className="relative">
              <label htmlFor="email" className="sr-only">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" inputMode="email" placeholder="Email" className={fieldBox} />
              <Mail size={17} className={icon} />
            </div>
            {mode !== "forgot" && (
              <div>
                <div className="relative">
                  <label htmlFor="password" className="sr-only">Password</label>
                  <input id="password" name="password" type={show ? "text" : "password"} required minLength={mode === "up" ? 10 : 1} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === "in" ? "current-password" : "new-password"} placeholder="Password" className={`${fieldBox} pr-12`} />
                  <Lock size={17} className={icon} />
                  <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted hover:text-ink">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                </div>
                {mode === "up" && (
                  <div className="mt-2.5" aria-live="polite">
                    <div className="grid grid-cols-4 gap-1.5" aria-hidden>
                      {[1, 2, 3, 4].map((n) => <span key={n} className={`h-1 rounded-full transition-colors ${score >= n ? (score <= 1 ? "bg-[var(--madder)]" : "bg-[var(--gold)]") : "bg-line"}`} />)}
                    </div>
                    <p className="mt-1.5 text-xs text-muted">{pw ? STRENGTH_LABEL[score] : "Use at least 10 characters."}</p>
                  </div>
                )}
                {mode === "in" && <div className="mt-2 text-right"><button type="button" onClick={() => switchTo("forgot")} className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline">Forgot password?</button></div>}
              </div>
            )}
            {error && <p role="alert" className="rounded-xl border border-[var(--madder)]/30 bg-[var(--madder)]/10 px-4 py-3 text-sm text-[var(--madder)]">{error}</p>}
            {note && <p role="status" className="rounded-xl bg-accent/10 px-4 py-3 text-sm">{note}</p>}
            <button disabled={busy} className="group mt-1 flex h-12 items-center justify-center gap-2 rounded-pill bg-accent text-sm font-semibold text-accent-ink shadow-lg transition hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0">
              {busy ? <><Loader2 size={16} className="animate-spin" /> Please wait</> : <>{mode === "forgot" ? "Send reset link" : mode === "in" ? "Sign in" : "Create account"}<ArrowRight size={16} className="transition group-hover:translate-x-0.5" /></>}
            </button>
          </form>

          <div className="mt-6 grid gap-2.5 text-sm text-muted">
            {mode === "forgot" && <button onClick={() => switchTo("in")} className="w-fit underline underline-offset-4 hover:text-ink">Back to sign in</button>}
            <Link href="/track" className="w-fit underline underline-offset-4 hover:text-ink">Track an order without signing in</Link>
            <p className="mt-1 flex items-center gap-2 text-xs"><Lock size={12} /> Your details stay private. We never post anything for you.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
