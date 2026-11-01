import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { getPublicSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  if (!(await rateLimit(`proof:${await clientIp()}`, 30, 60))) return NextResponse.json({ items: [] }, { status: 429 });
  const { proof } = await getPublicSettings();
  if (proof.mode !== "real") return NextResponse.json({ items: [] });

  try {
    const { data } = await createAdminClient()
      .from("orders")
      .select("guest_name, shipping_address, created_at, order_items(name_snapshot, unit_price)")
      .not("status", "in", "(cancelled,returned)")
      .gte("created_at", new Date(Date.now() - 14 * 864e5).toISOString())
      .order("created_at", { ascending: false })
      .limit(20);
    // Only a first name, the district, the product and the price are ever exposed, and only when the name looks real.
    const items = ((data ?? []) as unknown as OrderRow[])
      .filter((o) => o.order_items?.length && realName(o.guest_name))
      .map((o) => ({
        name: String(o.guest_name).trim().split(/\s+/)[0].slice(0, 20),
        city: o.shipping_address?.district ?? "Bangladesh",
        product: o.order_items[0].name_snapshot.replace(/ \(.*\)$/, ""),
        price: Number(o.order_items[0].unit_price),
        ago: ago(o.created_at),
      }))
      .slice(0, 10);
    return NextResponse.json({ items }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

/** Keeps out test entries and gibberish, so only real-looking names are shown to visitors. */
function realName(raw: string) {
  const name = String(raw ?? "").trim();
  const first = name.split(/\s+/)[0] ?? "";
  if (first.length < 3 || first.length > 20) return false;
  if (!/^[\p{L}][\p{L}.'-]*$/u.test(first)) return false;              // letters only
  if (/(.)\1{2,}/u.test(first)) return false;                           // aaaa
  if (/^(test|testing|demo|asdf|qwer|abc|xyz|nnn|aaa|customer|user|name|na)$/i.test(first)) return false;
  if (/^[a-z]+$/.test(first) && !/[aeiou]/i.test(first)) return false;  // no vowels at all
  return true;
}
