import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginView } from "@/components/LoginView";
import { getCatalog } from "@/lib/catalog";
import { getPublicSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };
export const revalidate = 300;

export default async function LoginPage() {
  const [{ products }, { brand }] = await Promise.all([getCatalog(), getPublicSettings()]);
  // A few real products, so the page shows what the store sells instead of a flat colour.
  const pick = [...products.filter((p) => p.image && p.tags.some((t) => t === "hot" || t === "featured" || t === "bestseller")), ...products.filter((p) => p.image)];
  const shelf = [...new Map(pick.map((p) => [p.id, p])).values()].slice(0, 3).map((p) => ({ name: p.name, image: p.image as string }));
  return (
    <Suspense>
      <LoginView brand={brand.name} logo={brand.logo} shelf={shelf} />
    </Suspense>
  );
}
