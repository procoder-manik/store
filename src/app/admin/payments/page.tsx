import { createClient } from "@/lib/supabase/server";
import { mergeSettings } from "@/lib/settings";
import { getCatalog } from "@/lib/catalog";
import { SITE_URL } from "@/lib/config";
import { sslConfig } from "@/lib/gateway-config";
import { PaymentsEditor } from "@/components/admin/PaymentsEditor";

export default async function Payments() {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("key, value");
  const s = mergeSettings((data ?? []) as { key: string; value: unknown }[]);
  const [cfg, { products }] = await Promise.all([sslConfig(), getCatalog()]);
  const ssl = { source: cfg?.source ?? ("none" as const), storeId: cfg?.source === "backend" ? cfg.storeId : "", live: !!cfg?.live, ipnUrl: `${SITE_URL}/api/pay/sslcommerz/ipn` };
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Payment methods</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">Choose how customers can pay. Turn each one on or off at any time. Customers only see the methods that are on and fully set up.</p>
      <div className="mt-6"><PaymentsEditor initial={s.payments} sslReady={!!cfg} ssl={ssl} products={products.map((p) => ({ id: p.id, name: p.name, image: p.image ?? "", preorder: !!p.preorder }))} /></div>
    </>
  );
}
