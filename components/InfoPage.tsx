import Link from "next/link";
import { INFO_SLUGS, INFO_TITLES } from "@/lib/info-pages";
import { Rich } from "./Rich";

export function InfoPage({ title, intro, sections, faq, current, wide = false, children }: {
  wide?: boolean;
  title: string; intro?: string; sections?: { heading: string; body: string }[]; faq?: { q: string; a: string }[]; current?: string; children?: React.ReactNode;
}) {
  return (
    <main>
      <div className="relative overflow-hidden border-b border-line bg-gradient-to-br from-accent/10 via-surface to-surface">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 py-10 md:py-14">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted"><Link href="/" className="hover:text-ink">Home</Link><span aria-hidden>/</span><span className="text-ink">{title}</span></nav>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-5xl">{title}</h1>
          <span aria-hidden className="mt-4 block h-1 w-14 rounded-full bg-accent" />
          {intro && <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">{intro}</p>}
        </div>
      </div>
      <div className={`mx-auto grid max-w-6xl gap-12 px-5 py-12 md:py-16 ${wide ? "" : "md:grid-cols-[1fr_240px]"}`}>
        <article className={`min-w-0 ${wide ? "" : "max-w-3xl"}`}>
          {sections?.map((s) => (
            <section key={s.heading} className="mb-10 last:mb-0">
              <h2 className="font-display text-xl font-semibold md:text-2xl">{s.heading}</h2>
              <div className="mt-3 grid gap-3 text-[15px] leading-relaxed text-muted"><Rich text={s.body} /></div>
            </section>
          ))}
          {faq && (
            <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
              {faq.map((f) => (
                <details key={f.q} className="group p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">{f.q}<span className="text-xl text-muted transition group-open:rotate-45" aria-hidden>+</span></summary>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          )}
          {children}
        </article>
        {!wide && <aside className="md:sticky md:top-24 md:self-start">
          <p className="text-sm font-medium">More help</p>
          <ul className="mt-3 grid gap-1 text-sm">
            {INFO_SLUGS.map((s) => (
              <li key={s}><Link href={`/${s}`} aria-current={current === s ? "page" : undefined} className={`block rounded-lg px-3 py-2 transition ${current === s ? "bg-accent/10 font-medium text-accent" : "text-muted hover:bg-surface hover:text-ink"}`}>{INFO_TITLES[s]}</Link></li>
            ))}
            <li><Link href="/track" className="block rounded-lg px-3 py-2 text-muted transition hover:bg-surface hover:text-ink">Track your order</Link></li>
          </ul>
        </aside>}
      </div>
    </main>
  );
}
