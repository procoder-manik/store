import Link from "next/link";
import { getCatalog } from "@/lib/catalog";

export default async function NotFound() {
  const { categories } = await getCatalog();
  return (
    <main className="mx-auto grid max-w-2xl place-items-center px-5 py-20 text-center md:py-28">
      <p className="font-display text-8xl font-semibold tracking-tight text-accent md:text-9xl">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold md:text-3xl">We could not find that page</h1>
      <p className="mt-3 max-w-md text-muted">The link may be old or mistyped. Try the shop, or pick a category below.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <Link href="/shop" className="rounded-pill bg-accent px-6 py-3 text-sm font-semibold text-accent-ink transition hover:-translate-y-0.5">Go to the shop</Link>
        <Link href="/" className="rounded-pill border border-line px-6 py-3 text-sm font-medium transition hover:bg-surface">Back to home</Link>
      </div>
      {categories.length > 0 && <div className="mt-8 flex flex-wrap justify-center gap-2">{categories.map((c) => <Link key={c.id} href={`/category/${c.id}`} className="rounded-pill border border-line bg-surface px-4 py-2 text-sm text-muted transition hover:text-ink">{c.label}</Link>)}</div>}
    </main>
  );
}
