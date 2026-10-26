import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CartItem } from "@/lib/cart";
import { RestoreCart } from "@/components/RestoreCart";

export const metadata: Metadata = { title: "Restoring your cart", robots: { index: false } };

type Saved = { id: string; variantId?: string; name: string; color: string; size: string; price: number; qty: number };

export default async function Restore({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await createAdminClient().from("abandoned_carts").select("items").eq("id", id).maybeSingle();
  if (!data) notFound();
  const items: CartItem[] = (data.items as Saved[]).map((i) => ({ ...i, key: `${i.variantId ?? i.id}|${i.color}|${i.size}` }));
  return <RestoreCart items={items} />;
}
