"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto grid max-w-xl place-items-center px-5 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold">Something went wrong</h1>
      <p className="mt-3 text-muted">This page could not load. Your cart is safe. Please try again.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button onClick={reset} className="rounded-pill bg-accent px-6 py-3 text-sm font-semibold text-accent-ink">Try again</button>
        <Link href="/" className="rounded-pill border border-line px-6 py-3 text-sm font-medium hover:bg-surface">Back to home</Link>
      </div>
    </main>
  );
}
