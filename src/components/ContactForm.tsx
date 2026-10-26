"use client";

import { useState, useTransition } from "react";
import { sendContact } from "@/app/actions/leads";

const input = "w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm";

export function ContactForm() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  if (msg?.ok) return <p role="status" className="rounded-2xl border border-line bg-paper p-6 text-sm">{msg.text}</p>;
  return (
    <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); setMsg(null); start(async () => { const r = await sendContact({ name: f.get("name"), phone: f.get("phone"), email: f.get("email") ?? "", message: f.get("message"), website: f.get("website") ?? "" }); setMsg({ ok: r.ok, text: r.message }); }); }} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" required placeholder="Your name" autoComplete="name" className={input} />
        <input name="phone" required inputMode="tel" placeholder="Mobile number" autoComplete="tel" className={input} />
      </div>
      <input name="email" type="email" placeholder="Email (optional)" autoComplete="email" className={input} />
      <textarea name="message" required minLength={10} maxLength={1000} rows={5} placeholder="How can we help? Include your order number if you have one." className={input} />
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {msg && !msg.ok && <p role="alert" className="text-sm text-red-600">{msg.text}</p>}
      <button disabled={pending} className="w-fit rounded-full bg-accent px-8 py-3 text-sm font-semibold text-accent-ink transition hover:-translate-y-0.5 disabled:opacity-50">{pending ? "Sending..." : "Send message"}</button>
    </form>
  );
}
