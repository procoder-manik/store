import type { Metadata } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { getPublicSettings } from "@/lib/settings";
import { sslConfigured } from "@/lib/sslcommerz";
import { availableMethods } from "@/lib/payments";
import { CheckoutForm, type BumpInfo, type Prefill, type Zone } from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

type Prod = { name: string; base_price: number | string; status: string };

export default async function Checkout() {
  const sb = createPublicClient();
  const supabase = sb ? await createClient() : null;
  const [zr, settings, auth] = await Promise.all([
    sb ? sb.from("shipping_zones").select("id, name, fee, free_over").eq("active", true).order("sort").order("fee") : Promise.resolve({ data: [] }),
    getPublicSettings(),
    supabase ? supabase.auth.getUser() : Promise.resolve({ data: { user: null } }),
  ]);
  const zones: Zone[] = (zr.data ?? []).map((z) => ({ id: z.id as string, name: z.name as string, fee: Number(z.fee), freeOver: z.free_over == null ? null : Number(z.free_over) }));

  let prefill: Prefill | null = null;
  const user = auth.data.user;
  if (user && supabase) {
    const [{ data: p }, { data: a }] = await Promise.all([
      supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
      supabase.from("addresses").select("name, phone, district, address").order("is_default", { ascending: false }).limit(1),
    ]);
    const addr = a?.[0];
    prefill = { name: addr?.name ?? p?.full_name ?? "", phone: addr?.phone ?? p?.phone ?? "", email: user.email ?? "", district: addr?.district ?? "", address: addr?.address ?? "" };
  }

  let bump: BumpInfo | null = null;
  const b = settings.bump;
  if (b.enabled && b.variantId && sb) {
    const { data } = await sb.from("product_variants").select("color_name, size, price_delta, stock, products(name, base_price, status)").eq("id", b.variantId).maybeSingle();
    const v = data as unknown as { color_name: string | null; size: string | null; price_delta: number | string; stock: number; products: Prod | Prod[] | null } | null;
    const prod = Array.isArray(v?.products) ? v?.products[0] : v?.products;
    if (v && prod && prod.status === "active" && v.stock > 0) {
      const normal = Number(prod.base_price) + Number(v.price_delta);
      const label = [v.color_name, v.size].filter(Boolean).join(", ");
      bump = { headline: b.headline, text: b.text, name: label ? `${prod.name} (${label})` : prod.name, price: b.price != null ? Number(b.price) : normal, normalPrice: normal };
    }
  }

  return <CheckoutForm zones={zones} bump={bump} prefill={prefill} methods={availableMethods(settings.payments, { sslReady: sslConfigured() })} />;
}
