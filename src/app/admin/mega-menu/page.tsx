import { getBanners } from "@/lib/banners";
import { getCatalog } from "@/lib/catalog";
import { mergeSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import { MegaMenuEditor } from "@/components/admin/MegaMenuEditor";

export const metadata = { title: "Mega menu" };

export default async function MegaMenuPage() {
  const supabase = await createClient();
  const [{ data }, { products, categories }, banners, { data: coupons }] = await Promise.all([supabase.from("site_settings").select("key, value"), getCatalog(), getBanners(), supabase.from("coupons").select("code").eq("active", true).order("code")]);
  const s = mergeSettings((data ?? []) as { key: string; value: unknown }[]);
  const nav = [...categories.map((c) => ({ label: c.label, href: `/category/${c.id}` })), { label: "Pre-order", href: "/pre-order" }, { label: "Offers", href: "/offers" }, { label: "All products", href: "/shop" }, ...s.header.links];
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Mega menu</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">A wide panel that opens under a top menu item when someone points at it. Choose a ready-made layout, then change anything: words, links, products, offers and pictures.</p>
      <div className="mt-6">
        <MegaMenuEditor initial={s.mega.menus} products={products} categories={categories} nav={[...new Map(nav.map((n) => [n.href, n])).values()]} banners={banners.filter((b) => b.title)} coupons={(coupons ?? []).map((c) => c.code as string)} theme={s.appearance.theme} />
      </div>
    </>
  );
}
