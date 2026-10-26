import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingForm, type LandingInitial } from "@/components/admin/LandingForm";

export default async function EditLanding({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: l }, { data: ps }] = await Promise.all([
    supabase.from("landing_pages").select("*").eq("id", id).maybeSingle(),
    supabase.from("products").select("id, name, base_price").eq("status", "active").order("name"),
  ]);
  if (!l) notFound();
  const initial: LandingInitial = {
    id: l.id, slug: l.slug, title: l.title, productId: l.product_id, headline: l.headline, subheadline: l.subheadline ?? "",
    bullets: (l.bullets as string[]).join("\n"), heroImage: l.hero_image ?? "", cta: l.cta_text, status: l.status,
    offers: (l.offers as { qty: number; price: number; label: string }[]).map((o) => ({ qty: String(o.qty), price: String(o.price), label: o.label ?? "" })),
  };
  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-semibold">Edit landing page</h1>
      <LandingForm products={(ps ?? []).map((p) => ({ id: p.id as string, name: p.name as string, price: Number(p.base_price) }))} initial={initial} />
    </>
  );
}
