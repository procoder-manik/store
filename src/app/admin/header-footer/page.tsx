import { createClient } from "@/lib/supabase/server";
import { getCatalog } from "@/lib/catalog";
import { mergeSettings } from "@/lib/settings";
import { sslConfigured } from "@/lib/sslcommerz";
import { availableMethods } from "@/lib/payments";
import { LayoutStylePicker } from "@/components/admin/LayoutStylePicker";

export default async function HeaderFooter() {
  const supabase = await createClient();
  const [{ data }, { categories }] = await Promise.all([supabase.from("site_settings").select("key, value"), getCatalog()]);
  const s = mergeSettings((data ?? []) as { key: string; value: unknown }[]);
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Header and footer</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">Click a design to use it. The preview below shows your own store name, menu and contact details. Change the menu links under Site and menu.</p>
      <div className="mt-6">
        <LayoutStylePicker header={s.headerStyle} footer={s.footerStyle} brand={s.brand} links={s.header.links} footerData={s.footer} contact={s.contact} categories={categories} payments={availableMethods(s.payments, { sslReady: sslConfigured() }).map((m) => m.name)} />
      </div>
    </>
  );
}
