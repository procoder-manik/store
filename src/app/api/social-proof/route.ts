import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { getPublicSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-static";
export const revalidate = 120;

const NAMES = ["Rahim", "Karim", "Sumaiya", "Nusrat", "Tanvir", "Mitu", "Arif", "Farhana", "Imran", "Sadia", "Rifat", "Jannat", "Hasan", "Tania", "Shakib", "Mim"];
const CITIES = ["Dhaka", "Chattogram", "Rangpur", "Sylhet", "Khulna", "Rajshahi", "Barishal", "Cumilla", "Gazipur", "Mymensingh", "Bogura", "Narayanganj"];
const AGO = ["12 minutes ago", "35 minutes ago", "1 hour ago", "2 hours ago", "3 hours ago", "5 hours ago", "Yesterday"];

function ago(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m} minutes ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ${h === 1 ? "hour" : "hours"} ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "Yesterday" : `${d} days ago`;
}

type OrderRow = { guest_name: string; shipping_address: { district?: string } | null; created_at: string; order_items: { name_snapshot: string; unit_price: number | string }[] };

export async function GET() {
  const { proof } = await getPublicSettings();
  if (proof.mode === "off") return NextResponse.json({ items: [] });

  if (proof.mode === "demo") {
    const { products } = await getCatalog();
    if (products.length === 0) return NextResponse.json({ items: [] });
    const items = Array.from({ length: 10 }, (_, k) => {
      const p = products[Math.floor(Math.random() * products.length)];
      return { name: NAMES[Math.floor(Math.random() * NAMES.length)], city: CITIES[(k + Math.floor(Math.random() * CITIES.length)) % CITIES.length], product: p.name, price: p.basePrice, ago: AGO[k % AGO.length] };
    });
    return NextResponse.json({ items });
  }

  try {
    const { data } = await createAdminClient()
      .from("orders")
      .select("guest_name, shipping_address, created_at, order_items(name_snapshot, unit_price)")
      .not("status", "in", "(cancelled,returned)")
      .order("created_at", { ascending: false })
      .limit(10);
    // Only a first name, the district, the product and the price are ever exposed.
    const items = ((data ?? []) as unknown as OrderRow[])
      .filter((o) => o.order_items?.length)
      .map((o) => ({
        name: String(o.guest_name).split(" ")[0].slice(0, 20),
        city: o.shipping_address?.district ?? "Bangladesh",
        product: o.order_items[0].name_snapshot.replace(/ \(.*\)$/, ""),
        price: Number(o.order_items[0].unit_price),
        ago: ago(o.created_at),
      }));
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
