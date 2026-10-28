import { createClient } from "@/lib/supabase/server";
import { mergeSettings } from "@/lib/settings";
import { sslConfigured } from "@/lib/sslcommerz";
import { PaymentsEditor } from "@/components/admin/PaymentsEditor";

export default async function Payments() {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("key, value");
  const s = mergeSettings((data ?? []) as { key: string; value: unknown }[]);
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Payment methods</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">Choose how customers can pay. Turn each one on or off at any time. Customers only see the methods that are on and fully set up.</p>
      <div className="mt-6"><PaymentsEditor initial={s.payments} sslReady={sslConfigured()} /></div>
    </>
  );
}
