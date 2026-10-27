"use client";

import Link from "next/link";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto grid max-w-lg gap-4 rounded-2xl border border-line bg-surface p-8 text-center">
      <h1 className="font-display text-2xl font-semibold">That did not work</h1>
      <p className="text-sm text-muted">Something went wrong while loading or saving this page. Nothing else was changed. Check the values you entered and try again.</p>
      {process.env.NODE_ENV !== "production" && error.message && <p className="rounded-xl bg-paper p-3 text-left font-mono text-xs break-words">{error.message}</p>}
      {error.digest && <p className="text-xs text-muted">Reference: {error.digest}</p>}
      <div className="flex justify-center gap-2">
        <button onClick={reset} className="rounded-pill bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink">Try again</button>
        <Link href="/admin" className="rounded-pill border border-line px-6 py-2.5 text-sm font-medium hover:bg-paper">Dashboard</Link>
      </div>
    </div>
  );
}
