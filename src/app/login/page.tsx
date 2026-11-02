import type { Metadata } from "next";
import { LoginView } from "@/components/LoginView";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

/** Only same-site paths are allowed, so a crafted link cannot send someone to another website after signing in. */
function safePath(n?: string) {
  return n && /^\/(?![/\\])/.test(n) && !/[\\\r\n]/.test(n) ? n : "/";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const [{ products }, q] = await Promise.all([getCatalog(), searchParams]);
  // A few real products, so the page shows what the store sells instead of a flat colour.
  const pick = [...products.filter((p) => p.image && p.tags.some((t) => t === "hot" || t === "featured" || t === "bestseller")), ...products.filter((p) => p.image)];
  const shelf = [...new Map(pick.map((p) => [p.id, p])).values()].slice(0, 3).map((p) => ({ name: p.name, image: p.image as string }));
  return <LoginView shelf={shelf} next={safePath(q.next)} failed={q.error === "social"} />;
}
