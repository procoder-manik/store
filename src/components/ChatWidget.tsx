"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { MessageCircle, Send, Volume2, VolumeX, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { chatLead } from "@/app/actions/leads";

type Msg = { role: "user" | "assistant"; content: string };

function ping() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      const t = ctx.currentTime + i * 0.09;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.15, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.2);
    });
    window.setTimeout(() => ctx.close(), 600);
  } catch { /* sound is optional */ }
}

function Text({ text }: { text: string }) {
  const parts = text.split(/(\/(?:product\/[a-z0-9-]+|shop|category\/[a-z0-9-]+|track))/g);
  return <>{parts.map((p, i) => (i % 2 ? <Link key={i} href={p} className="font-medium underline">{p}</Link> : <span key={i}>{p}</span>))}</>;
}

export function ChatWidget({ name, greeting }: { name: string; greeting: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: greeting }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [muted, setMuted] = useState(false);
  const [lead, setLead] = useState<"hidden" | "form" | "done">("hidden");
  const [leadErr, setLeadErr] = useState("");
  const [pending, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  const users = msgs.filter((m) => m.role === "user").length;

  useEffect(() => { try { setMuted(localStorage.getItem("chat-muted") === "1"); } catch { /* storage blocked */ } }, []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy, lead, open]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  if (/^\/(admin|checkout|login)/.test(path)) return null;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(next); setText(""); setBusy(true);
    let reply = "Sorry, something went wrong. Please try again.";
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: next.slice(-8) }) });
      reply = ((await res.json()) as { reply?: string }).reply ?? reply;
    } catch { /* keep fallback */ }
    setMsgs([...next, { role: "assistant", content: reply }]);
    setBusy(false);
    if (!muted) ping();
  }

  function saveLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setLeadErr("");
    start(async () => {
      const r = await chatLead({ name: String(f.get("name")), phone: String(f.get("phone")), message: [...msgs].reverse().find((m) => m.role === "user")?.content ?? "" });
      if (r.ok) setLead("done"); else setLeadErr(r.message);
    });
  }

  const toggleSound = () => { const m = !muted; setMuted(m); try { localStorage.setItem("chat-muted", m ? "1" : "0"); } catch { /* storage blocked */ } };

  return (
    <>
      {!open && (
        <button aria-label="Open chat" onClick={() => setOpen(true)} className="fixed bottom-20 right-3 z-40 grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-ink shadow-xl transition hover:scale-105 md:bottom-5 md:right-5"><MessageCircle size={24} /></button>
      )}
      {open && (
        <section aria-label={name} className="pop-in fixed inset-x-3 bottom-3 z-50 flex h-[min(560px,80dvh)] flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl md:inset-x-auto md:bottom-5 md:right-5 md:w-[380px]">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-display text-base font-semibold">{name}</p>
            <div className="flex items-center gap-1">
              <button aria-label={muted ? "Turn sound on" : "Turn sound off"} onClick={toggleSound} className="grid h-9 w-9 place-items-center rounded-full hover:bg-paper">{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
              <button aria-label="Close chat" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-paper"><X size={16} /></button>
            </div>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <p className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-accent text-accent-ink" : "bg-paper"}`}>{m.role === "assistant" ? <Text text={m.content} /> : m.content}</p>
              </div>
            ))}
            {busy && <p className="w-fit rounded-2xl bg-paper px-4 py-2.5 text-sm text-muted"><span className="animate-pulse">Typing...</span></p>}
            {users >= 3 && lead === "hidden" && <button onClick={() => setLead("form")} className="w-full rounded-2xl border border-dashed border-accent p-3 text-left text-sm text-accent">Want our team to call you? Leave your number.</button>}
            {lead === "form" && (
              <form onSubmit={saveLead} className="grid gap-2 rounded-2xl border border-line p-3">
                <input name="name" required placeholder="Your name" className="rounded-xl border border-line bg-paper px-3 py-2 text-sm" />
                <input name="phone" required inputMode="tel" placeholder="Mobile number" className="rounded-xl border border-line bg-paper px-3 py-2 text-sm" />
                {leadErr && <p role="alert" className="text-xs text-red-600">{leadErr}</p>}
                <button disabled={pending} className="rounded-pill bg-accent py-2 text-sm font-semibold text-accent-ink disabled:opacity-50">Call me</button>
              </form>
            )}
            {lead === "done" && <p className="rounded-2xl bg-paper p-3 text-sm">Thank you. We will contact you soon.</p>}
            <div ref={end} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Ask about products or delivery" aria-label="Your message" className="min-w-0 flex-1 rounded-pill border border-line bg-paper px-4 py-2.5 text-sm" />
            <button aria-label="Send" disabled={busy || !text.trim()} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-accent-ink disabled:opacity-40"><Send size={16} /></button>
          </form>
        </section>
      )}
    </>
  );
}
