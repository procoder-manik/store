"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { RotateCcw, SendHorizontal, Volume2, VolumeX, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { chatLead } from "@/app/actions/leads";
import { formatPrice } from "@/lib/config";

type Card = { name: string; slug: string; price: number; compareAt: number | null; image: string };
type Chip = { href: string; label: string };
type Msg = { role: "user" | "assistant"; content: string; products?: Card[]; links?: Chip[] };

const STARTERS = ["What offers are running?", "What is coming soon?", "How much is delivery?", "How can I pay?"];
const LOG = "chat-log";

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

function Glyph({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
      <path d="M12 3.5c-5 0-8.75 3.4-8.75 7.8 0 2.2 .95 4.2 2.55 5.6L5 20.5l4-1.6c.95 .25 1.95 .4 3 .4 5 0 8.75-3.5 8.75-8s-3.75-7.8-8.75-7.8Z" />
      <g fill="currentColor" stroke="none"><circle className="chat-dot" cx="8.25" cy="11.5" r="1.1" /><circle className="chat-dot" cx="12" cy="11.5" r="1.1" /><circle className="chat-dot" cx="15.75" cy="11.5" r="1.1" /></g>
    </svg>
  );
}

function Face({ avatar, size }: { avatar: string; size: string }) {
  return avatar
    ? <img src={avatar} alt="" className={`${size} shrink-0 rounded-full object-cover`} />
    : <span className={`${size} grid shrink-0 place-items-center rounded-full bg-accent text-accent-ink`}><Glyph size={20} /></span>;
}

export function ChatWidget({ name, greeting, avatar = "", whatsapp = "", waNote = "" }: { name: string; greeting: string; avatar?: string; whatsapp?: string; waNote?: string }) {
  const path = usePathname();
  const first: Msg[] = [{ role: "assistant", content: greeting }];
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(first);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [muted, setMuted] = useState(false);
  const [lead, setLead] = useState<"hidden" | "form" | "done">("hidden");
  const [leadErr, setLeadErr] = useState("");
  const [pending, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  const users = msgs.filter((m) => m.role === "user").length;
  const lastAsked = [...msgs].reverse().find((m) => m.role === "user")?.content;

  useEffect(() => {
    try {
      setMuted(localStorage.getItem("chat-muted") === "1");
      const saved = sessionStorage.getItem(LOG);
      if (saved) setMsgs(JSON.parse(saved) as Msg[]);
    } catch { /* storage blocked */ }
  }, []);
  useEffect(() => { try { if (msgs.length > 1) sessionStorage.setItem(LOG, JSON.stringify(msgs.slice(-20))); } catch { /* storage blocked */ } }, [msgs]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy, lead, open]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  if (/^\/(admin|checkout|login)/.test(path)) return null;

  async function ask(q: string) {
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(next); setText(""); setBusy(true);
    let answer: Msg = { role: "assistant", content: "Sorry, something went wrong. Please try again." };
    try {
      // Cards leave the text, so their names go along or "how much is the second one?" would have nothing to refer to.
      const history = next.slice(-8).map((m) => ({ role: m.role, content: [m.content, m.products?.length ? `(Showed: ${m.products.map((p) => p.name).join(", ")})` : ""].filter(Boolean).join(" ").slice(0, 590) }));
      const res = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: history, path }) });
      const d = (await res.json()) as { reply?: string; products?: Card[]; links?: Chip[] };
      if (d.reply) answer = { role: "assistant", content: d.reply, products: d.products, links: d.links };
    } catch { /* keep fallback */ }
    setMsgs([...next, answer]);
    setBusy(false);
    if (!muted) ping();
  }

  function saveLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setLeadErr("");
    start(async () => {
      const r = await chatLead({ name: String(f.get("name")), phone: String(f.get("phone")), message: lastAsked ?? "" });
      if (r.ok) setLead("done"); else setLeadErr(r.message);
    });
  }

  const toggleSound = () => { const m = !muted; setMuted(m); try { localStorage.setItem("chat-muted", m ? "1" : "0"); } catch { /* storage blocked */ } };
  const restart = () => { setMsgs(first); setLead("hidden"); try { sessionStorage.removeItem(LOG); } catch { /* storage blocked */ } };

  return (
    <>
      {!open && (
        <button aria-label="Open chat" onClick={() => setOpen(true)} className="chat-launcher float-lift fixed bottom-4 left-3 z-40 flex h-12 items-center rounded-full bg-accent text-accent-ink transition hover:-translate-y-0.5 md:bottom-5 md:left-5 md:h-14">
          <span className="relative grid h-12 w-12 shrink-0 place-items-center md:h-14 md:w-14">
            {avatar ? <img src={avatar} alt="" className="h-full w-full rounded-full object-cover" /> : <Glyph size={26} />}
            <span aria-hidden className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full border-2 border-accent bg-emerald-400 md:right-1 md:top-1" />
          </span>
          <span className="hidden pr-6 text-sm font-semibold md:block">Ask us</span>
        </button>
      )}
      {open && (
        <section aria-label={name} className="chat-glass pop-in fixed inset-x-2 bottom-2 z-50 flex h-[min(620px,86dvh)] flex-col overflow-hidden rounded-[22px] text-ink md:inset-x-auto md:bottom-5 md:left-5 md:w-[400px]">
          <header className="flex items-center gap-3 border-b border-ink/10 px-4 py-3">
            <Face avatar={avatar} size="h-10 w-10" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-semibold leading-tight">{name}</p>
              <p className="truncate text-xs text-ink/70">Automated assistant, answers right away</p>
            </div>
            {users > 0 && <button aria-label="Start over" onClick={restart} className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-ink/10"><RotateCcw size={15} /></button>}
            <button aria-label={muted ? "Turn sound on" : "Turn sound off"} onClick={toggleSound} className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-ink/10">{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
            <button aria-label="Close chat" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-ink/10"><X size={17} /></button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
                <p className={`max-w-[88%] whitespace-pre-line rounded-[18px] px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "rounded-br-[6px] bg-accent text-accent-ink" : "rounded-bl-[6px] bg-ink/[0.07]"}`}>{m.content}</p>
                {m.products?.map((p) => (
                  <Link key={p.slug} href={`/product/${p.slug}`} className="flex w-[88%] items-center gap-3 rounded-[14px] border border-ink/15 p-2 transition hover:border-ink/50">
                    {p.image ? <img src={p.image} alt="" className="h-12 w-12 shrink-0 object-contain" /> : <span className="h-12 w-12 shrink-0 rounded-[10px] bg-ink/10" />}
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{p.name}</span><span className="block text-xs tabular-nums">{formatPrice(p.price)}{p.compareAt != null && <s className="ml-1.5 text-ink/60">{formatPrice(p.compareAt)}</s>}</span></span>
                  </Link>
                ))}
                {!!m.links?.length && (
                  <div className="flex max-w-[88%] flex-wrap gap-2">
                    {m.links.map((l) => <Link key={l.href} href={l.href} className="rounded-full border border-ink/25 px-3 py-1.5 text-xs font-semibold transition hover:bg-ink/10">{l.label}</Link>)}
                  </div>
                )}
              </div>
            ))}
            {users === 0 && !busy && (
              <div className="flex flex-wrap gap-2">
                {STARTERS.map((s) => <button key={s} onClick={() => ask(s)} className="rounded-full border border-ink/25 px-3 py-1.5 text-xs font-medium transition hover:bg-ink/10">{s}</button>)}
              </div>
            )}
            {busy && <p role="status" aria-label="Typing" className="flex w-fit gap-1.5 rounded-[18px] rounded-bl-[6px] bg-ink/[0.07] px-4 py-3.5"><i className="typing-dot" /><i className="typing-dot" /><i className="typing-dot" /></p>}
            {users >= 3 && lead === "hidden" && <button onClick={() => setLead("form")} className="w-full rounded-[14px] border border-dashed border-ink/30 p-3 text-left text-sm">Want our team to call you? Leave your number.</button>}
            {lead === "form" && (
              <form onSubmit={saveLead} className="grid gap-2 rounded-[14px] border border-ink/15 p-3">
                <input name="name" required placeholder="Your name" className="rounded-full bg-ink/[0.07] px-4 py-2 text-base outline-none focus:ring-2 focus:ring-accent md:text-sm" />
                <input name="phone" required inputMode="tel" placeholder="Mobile number" className="rounded-full bg-ink/[0.07] px-4 py-2 text-base outline-none focus:ring-2 focus:ring-accent md:text-sm" />
                {leadErr && <p role="alert" className="text-xs font-medium text-[var(--madder)]">{leadErr}</p>}
                <button disabled={pending} className="rounded-full bg-accent py-2 text-sm font-semibold text-accent-ink disabled:opacity-50">Call me</button>
              </form>
            )}
            {lead === "done" && <p className="rounded-[14px] bg-ink/[0.07] p-3 text-sm">Thank you. We will contact you soon.</p>}
            <div ref={end} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); ask(text.trim()); }} className="flex items-center gap-2 p-3 pt-1">
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Ask in Bangla or English" aria-label="Your message" className="min-w-0 flex-1 rounded-full bg-ink/[0.07] px-4 py-3 text-base outline-none placeholder:text-ink/60 focus:ring-2 focus:ring-accent md:text-sm" />
            <button aria-label="Send" disabled={busy || !text.trim()} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-accent-ink transition disabled:opacity-40"><SendHorizontal size={17} /></button>
          </form>
          {whatsapp && (
            <p className="px-4 pb-3 text-center text-xs text-ink/70">
              Prefer a person?{" "}
              <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent([waNote, lastAsked && `My question: ${lastAsked}`].filter(Boolean).join("\n\n"))}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">Message us on WhatsApp</a>
            </p>
          )}
        </section>
      )}
    </>
  );
}
