"use client";

import { useState, useTransition } from "react";
import { subscribe } from "@/app/actions/leads";

export function NewsletterForm() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    start(async () => {
      const r = await subscribe({ email: String(f.get("email")), website: String(f.get("website") ?? "") });
      setMsg({ ok: r.ok, text: r.message });
    });
  }
  return (
    <form onSubmit={submit} className="mt-5 max-w-xs">
      <label htmlFor="nl-email" className="text-sm font-medium">Get new arrivals and offers</label>
      <div className="mt-2 flex gap-2">
        <input id="nl-email" name="email" type="email" required placeholder="Your email" autoComplete="email" className="min-w-0 flex-1 rounded-full border border-line bg-paper px-4 py-2 text-sm" />
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <button disabled={pending} className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-50">Join</button>
      </div>
      {msg && <p role="status" className={`mt-2 text-xs ${msg.ok ? "text-muted" : "text-red-600"}`}>{msg.text}</p>}
    </form>
  );
}
