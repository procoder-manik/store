import { createClient } from "@/lib/supabase/server";
import { getCatalog } from "@/lib/catalog";
import { mergeSettings } from "@/lib/settings";
import { MenuEditor } from "@/components/admin/MenuEditor";

export default async function Menus() {
  const supabase = await createClient();
  const [{ data }, { categories }, { data: pages }] = await Promise.all([
    supabase.from("site_settings").select("key, value"),
    getCatalog(),
    supabase.from("pages").select("slug, title").eq("status", "active"),
  ]);
  const s = mergeSettings((data ?? []) as { key: string; value: unknown }[]);
  const suggestions = [
    { label: "Shop", href: "/shop" }, { label: "Track your order", href: "/track" }, { label: "My account", href: "/account" }, { label: "Wishlist", href: "/wishlist" },
    ...categories.map((c) => ({ label: c.label, href: `/shop?cat=${c.id}` })),
    ...(pages ?? []).map((p) => ({ label: p.title as string, href: `/p/${p.slug}` })),
  ];
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Site, menu and footer</h1>
      <div className="mt-6"><MenuEditor initial={{ brand: s.brand, header: s.header, footer: s.footer }} suggestions={suggestions} /></div>
    </>
  );
}
