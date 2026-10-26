import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ManualOrderForm, type Option } from "@/components/admin/ManualOrderForm";

type P = { id: string; name: string; base_price: number | string; product_variants: { id: string; color_name: string | null; size: string | null; price_delta: number | string; stock: number }[] };

export default async function NewOrder() {
  const supabase = await createClient();
  const [{ data: prods }, { data: zones }] = await Promise.all([
    supabase.from("products").select("id, name, base_price, product_variants(id, color_name, size, price_delta, stock)").eq("status", "active").order("name"),
    supabase.from("shipping_zones").select("id, name, fee").eq("active", true).order("sort"),
  ]);
  const options: Option[] = ((prods ?? []) as unknown as P[]).flatMap((p): Option[] =>
    p.product_variants.length === 0
      ? [{ key: `p:${p.id}`, productId: p.id, label: p.name, price: Number(p.base_price), stock: null }]
      : p.product_variants.map((v) => ({ key: `v:${v.id}`, productId: p.id, variantId: v.id, label: `${p.name} (${[v.color_name, v.size].filter(Boolean).join(", ") || "Standard"})`, price: Number(p.base_price) + Number(v.price_delta), stock: v.stock })),
  );
  return (
    <>
      <Link href="/admin/orders" className="text-sm text-muted hover:underline">All orders</Link>
      <h1 className="mb-6 mt-2 font-display text-2xl font-semibold">New phone order</h1>
      <ManualOrderForm options={options} zones={(zones ?? []).map((z) => ({ id: z.id as string, name: z.name as string, fee: Number(z.fee) }))} />
    </>
  );
}
