"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Heart, Loader2, Lock, Mail, PackageCheck, ShieldCheck, Sparkles, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const SOCIAL = [{ id: "google" as const, name: "Google" }, { id: "facebook" as const, name: "Facebook" }];
type Mode = "in" | "up" | "forgot";
type Shelf = { name: string; image: string }[];

const HEAD: Record<Mode, { title: string; sub: string }> = {
  in: { title: "Welcome back", sub: "Sign in to see your orders and saved things." },
  up: { title: "Join us", sub: "Takes a minute. Checkout gets faster and every order is easy to find." },
  forgot: { title: "Reset your password", sub: "Enter your email and we will send you a link to set a new one." },
};

const PERKS = [
  { icon: PackageCheck, text: "Track every order" },
  { icon: Heart, text: "Save what you love" },
  { icon: Sparkles, text: "First to hear of offers" },
];

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

/** 0 to 4. Length counts most, then a mix of kinds of characters. */
function strength(pw: string) {
  if (!pw) return 0;
  if (pw.length < 10) return 1;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  return pw.length >= 14 && kinds >= 3 ? 4 : kinds >= 3 ? 3 : 2;
}
const STRENGTH_LABEL = ["", "Too short. Use at least 10 characters.", "Okay", "Good", "Strong"];

/** A field whose label sits inside it, then lifts out of the way when there is something typed. */
function Field({ id, label, icon: Icon, children, ...rest }: { id: string; label: string; icon: ComponentType<{ size?: number; className?: string }>; children?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="login-field relative">
      <input id={id} name={id} placeholder=" " {...rest} className={`peer h-[3.5rem] w-full rounded-[14px] border border-ink/15 bg-surface/70 pb-1.5 pl-11 pr-12 pt-5 text-base text-ink outline-none transition focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/15 md:text-sm`} />
      <label htmlFor={id} className="pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 text-sm text-muted transition-all peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px]">{label}</label>
      <Icon size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted transition peer-focus:text-accent" />
      {children}
    </div>
  );
}

export function LoginView({ shelf, next, failed, direct }: { shelf: Shelf; next: string; failed: boolean; direct: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("in");
  const [error, setError] = useState(failed ? "Sign in did not finish. Please try again, or use your email." : "");
  const [social, setSocial] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState("");
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
    if (provider === "google" && direct) { window.location.assign(`/auth/google?next=${encodeURIComponent(next)}`); return; }
    const { error: err } = await createClient().auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
    if (err) { setError("Could not start sign in. Please try again."); setBusy(false); }
  }

  function switchTo(m: Mode) {
    setMode(m);
    setError("");
    setNote("");
    setPw("");
    setShow(false);
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
    <main className="login-stage relative isolate overflow-hidden">
      {/* One continuous scene: slow light behind everything, a faint grid, and the real products floating in it. */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <span className="login-blob login-blob-a animate-aurora-a" />
        <span className="login-blob login-blob-b animate-aurora-b" />
        <span className="login-grid" />
      </div>

      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-7xl items-center gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,27rem)] lg:gap-16 lg:px-12 lg:py-14">
        <div className="login-copy relative">
          <h2 className="login-in max-w-xl font-display text-[clamp(2rem,1.2rem+3.4vw,4.75rem)] leading-[1.02]">Good things, carried to your door.</h2>
          <ul aria-hidden className="login-in mt-5 hidden flex-wrap gap-2.5 sm:flex lg:mt-7" style={{ ["--d" as string]: "0.1s" }}>
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="login-chip flex items-center gap-2 rounded-full px-3.5 py-2 text-sm"><Icon size={15} className="text-[var(--login-spark)]" />{text}</li>
            ))}
          </ul>
          {shelf.length > 0 && (
            <div aria-hidden className="relative mx-auto mt-10 hidden h-64 max-w-xl lg:block xl:h-80">
              {shelf.map((p, i) => (
                <div key={p.image} className={`login-in absolute bottom-0 h-full w-[46%] ${i === 0 ? "left-0 -rotate-6" : i === 1 ? "left-1/2 z-10 -translate-x-1/2" : "right-0 rotate-6"}`} style={{ ["--d" as string]: `${0.2 + i * 0.12}s` }}>
                  <img src={p.image} alt="" className={`h-full w-full object-contain drop-shadow-[0_26px_28px_rgba(0,0,0,0.5)] ${i === 1 ? "scale-110" : "scale-90"} login-drift`} style={{ animationDelay: `${i * -2.2}s` }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <section className="login-glass login-in w-full rounded-[26px] p-5 text-ink sm:p-8" style={{ ["--d" as string]: "0.08s" }}>
          {mode !== "forgot" && (
            <div role="tablist" aria-label="Sign in or create an account" className="relative mb-6 grid h-12 grid-cols-2 rounded-full bg-ink/[0.07] p-1 text-sm font-semibold">
              <span aria-hidden className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-surface shadow-[0_6px_16px_-6px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out ${mode === "up" ? "translate-x-full" : ""}`} />
              {(["in", "up"] as const).map((m) => (
                <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => switchTo(m)} className={`relative whitespace-nowrap rounded-full transition-colors ${mode === m ? "text-ink" : "text-muted hover:text-ink"}`}>{m === "in" ? "Sign in" : "Create account"}</button>
              ))}
            </div>
          )}

          <h1 className="font-display text-[1.75rem] leading-tight sm:text-[2.1rem]">{head.title}</h1>
          <p className="mt-1.5 text-sm text-muted">{head.sub}</p>

          {hasSocial && (
            <>
              <div className={`mt-5 grid gap-2.5 ${social.length > 1 ? "grid-cols-2" : ""}`}>
                {SOCIAL.filter((p) => social.includes(p.id)).map((p) => (
                  <button key={p.id} type="button" aria-label={`Continue with ${p.name}`} disabled={busy} onClick={() => continueWith(p.id)} className="flex h-12 items-center justify-center gap-2.5 rounded-[14px] border border-ink/15 bg-surface/80 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-ink/35 hover:bg-surface active:translate-y-0 disabled:opacity-50">{p.id === "google" ? <GoogleMark /> : <FacebookMark />} {p.name}</button>
                ))}
              </div>
              <p className="mt-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-ink/15" />or use your email<span className="h-px flex-1 bg-ink/15" /></p>
            </>
          )}

          <form onSubmit={submit} className={`${hasSocial ? "mt-4" : "mt-5"} grid gap-3`}>
            {mode === "up" && <Field id="name" label="Full name" icon={User} required autoComplete="name" />}
            <Field id="email" label="Email" icon={Mail} type="email" required autoComplete="email" inputMode="email" />
            {mode !== "forgot" && (
              <div>
                <Field id="password" label="Password" icon={Lock} type={show ? "text" : "password"} required minLength={mode === "up" ? 10 : 1} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === "in" ? "current-password" : "new-password"}>
                  <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted hover:text-ink">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                </Field>
                {mode === "up" && (
                  <div className="mt-2.5" aria-live="polite">
                    <div className="grid grid-cols-4 gap-1.5" aria-hidden>
                      {[1, 2, 3, 4].map((n) => <span key={n} className={`h-1 rounded-full transition-colors duration-300 ${score >= n ? (score <= 1 ? "bg-[var(--madder)]" : "bg-[var(--gold)]") : "bg-ink/10"}`} />)}
                    </div>
                    <p className="mt-1.5 text-xs text-muted">{pw ? STRENGTH_LABEL[score] : "Use at least 10 characters."}</p>
                  </div>
                )}
                {mode === "in" && <div className="mt-2 text-right"><button type="button" onClick={() => switchTo("forgot")} className="text-xs font-medium text-muted underline-offset-4 hover:text-ink hover:underline">Forgot password?</button></div>}
              </div>
            )}
            {error && <p role="alert" className="rounded-[14px] border border-[var(--madder)]/30 bg-[var(--madder)]/10 px-4 py-3 text-sm text-[var(--madder)]">{error}</p>}
            {note && <p role="status" className="rounded-[14px] bg-accent/10 px-4 py-3 text-sm">{note}</p>}
            <button disabled={busy} className="group mt-1 flex h-[3.25rem] items-center justify-center gap-2 rounded-[14px] bg-accent text-sm font-semibold text-accent-ink shadow-[0_16px_30px_-14px_var(--accent)] transition hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0">
              {busy ? <><Loader2 size={16} className="animate-spin" /> Please wait</> : <>{mode === "forgot" ? "Send reset link" : mode === "in" ? "Sign in" : "Create my account"}<ArrowRight size={16} className="transition group-hover:translate-x-1" /></>}
            </button>
          </form>

          <div className="mt-5 grid gap-2 text-sm text-muted">
            {mode === "forgot" && <button onClick={() => switchTo("in")} className="w-fit font-medium underline underline-offset-4 hover:text-ink">Back to sign in</button>}
            <Link href="/track" className="w-fit underline underline-offset-4 hover:text-ink">Track an order without signing in</Link>
            <p className="mt-1 flex items-center gap-2 text-xs"><ShieldCheck size={13} /> Your details stay private. We never post anything for you.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
