"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const safeNext = (() => {
    const n = params.get("next") ?? "/";
    return n.startsWith("/") && !n.startsWith("//") ? n : "/";
  })();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    const password = String(f.get("password"));
    const supabase = createClient();
    const { error: err } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { full_name: String(f.get("name") ?? "") } } });
    setBusy(false);
    if (err) return setError(err.message);
    router.push(safeNext);
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-sm px-5 py-16">
      <h1 className="font-display text-2xl font-semibold">{mode === "in" ? "Sign in" : "Create account"}</h1>
      <form onSubmit={submit} className="mt-6 grid gap-3">
        {mode === "up" && <input name="name" required placeholder="Full name" autoComplete="name" className="rounded-xl border border-line bg-surface px-4 py-3 text-sm" />}
        <input name="email" type="email" required placeholder="Email" autoComplete="email" className="rounded-xl border border-line bg-surface px-4 py-3 text-sm" />
        <input name="password" type="password" required minLength={10} placeholder="Password (10+ characters)" autoComplete={mode === "in" ? "current-password" : "new-password"} className="rounded-xl border border-line bg-surface px-4 py-3 text-sm" />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="rounded-pill bg-accent py-3 text-sm font-semibold text-accent-ink disabled:opacity-50">{mode === "in" ? "Sign in" : "Create account"}</button>
      </form>
      <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 text-sm text-muted underline">
        {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
      </button>
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
