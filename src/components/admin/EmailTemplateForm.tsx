"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveTemplate } from "@/app/admin/emails/actions";
import { brandedEmail } from "@/lib/email-html";

export type TemplateInitial = { id?: string; name: string; subject: string; heading: string; body: string; buttonText: string; buttonUrl: string; imageUrl: string };
const EMPTY: TemplateInitial = { name: "", subject: "", heading: "", body: "", buttonText: "Shop now", buttonUrl: "/shop", imageUrl: "" };
const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";
const label = "mb-1 block text-xs font-medium text-muted";

export function EmailTemplateForm({ initial = EMPTY, brand }: { initial?: TemplateInitial; brand: string }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const set = <K extends keyof TemplateInitial>(k: K, v: string) => setF((p) => ({ ...p, [k]: v }));

  const preview = useMemo(() => brandedEmail({
    brand, siteUrl: typeof window === "undefined" ? "" : window.location.origin,
    heading: (f.heading || "Your heading").replace(/\{\{\s*name\s*\}\}/gi, "Rahim"), body: (f.body || "Your message appears here.").replace(/\{\{\s*name\s*\}\}/gi, "Rahim"),
    buttonText: f.buttonText, buttonUrl: f.buttonUrl, imageUrl: f.imageUrl, unsubscribeUrl: "#",
  }).html, [f, brand]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const r = await saveTemplate(f);
      if (!r.ok) return setError(r.error);
      router.push("/admin/emails");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={submit} className="grid content-start gap-4 rounded-xl border border-line bg-surface p-5">
        <div><label className={label}>Template name (only you see this)</label><input className={input} required maxLength={80} value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div><label className={label}>Subject line</label><input className={input} required maxLength={150} value={f.subject} onChange={(e) => set("subject", e.target.value)} /></div>
        <div><label className={label}>Heading</label><input className={input} required maxLength={120} value={f.heading} onChange={(e) => set("heading", e.target.value)} /></div>
        <div><label className={label}>Message (leave a blank line between paragraphs, use {"{{name}}"} for the first name)</label><textarea className={input} required rows={8} maxLength={4000} value={f.body} onChange={(e) => set("body", e.target.value)} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={label}>Button text</label><input className={input} maxLength={40} value={f.buttonText} onChange={(e) => set("buttonText", e.target.value)} /></div>
          <div><label className={label}>Button link</label><input className={input} placeholder="/shop" value={f.buttonUrl} onChange={(e) => set("buttonUrl", e.target.value)} /></div>
        </div>
        <div><label className={label}>Top image link (optional, Pexels, Unsplash or Pixabay)</label><input className={input} value={f.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} /></div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={pending} className="w-fit rounded-full bg-accent px-7 py-3 text-sm font-semibold text-accent-ink disabled:opacity-50">{pending ? "Saving..." : "Save template"}</button>
      </form>
      <div>
        <p className="mb-2 text-xs font-medium text-muted">Live preview</p>
        <iframe title="Email preview" sandbox="" srcDoc={preview} className="h-[640px] w-full rounded-xl border border-line bg-white" />
      </div>
    </div>
  );
}
