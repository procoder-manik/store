"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { checkFraud } from "@/lib/fraud";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/utils";
import { clientIp, rateLimit } from "@/lib/ratelimit";

const schema = z.object({
  slug: z.string().max(80),
  qty: z.number().int().min(1).max(20),
  variantId: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z.string().trim().max(20),
  zoneId: z.string().uuid("Choose a delivery area"),
  district: z.string().trim().min(2, "Enter your district").max(60),
  address: z.string().trim().min(6, "Enter your full address").max(300),
  note: z.string().trim().max(300),
  website: z.string(),
});

const GENERIC = "We could not place this order. Please contact us to complete it.";
type Placed = { ok: true; id: string } | { ok: false; error: string };

/** Price comes from the saved offer, never from the browser. */
export async function placeLandingOrder(input: unknown): Promise<Placed> {
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const d = p.data;
  if (d.website) return { ok: false, error: GENERIC };
  if (!(await rateLimit(`order:${await clientIp()}`, 6, 600))) return { ok: false, error: "Too many orders from this connection. Please wait a few minutes or call us." };
  const phone = normalizePhone(d.phone);
  if (!phone) return { ok: false, error: "Enter a valid Bangladeshi mobile number, like 01712345678." };

  try {
    const db = createAdminClient();
    const { data: l } = await db.from("landing_pages").select("product_id, offers, status").eq("slug", d.slug).maybeSingle();
    if (!l || l.status !== "active") return { ok: false, error: "This offer is no longer available." };
    const offer = (l.offers as { qty: number; price: number }[]).find((o) => o.qty === d.qty);
    if (!offer) return { ok: false, error: "Choose one of the offers." };

    const { data: prod } = await db.from("products").select("name, status, product_variants(id, color_name, size, stock)").eq("id", l.product_id).maybeSingle();
    if (!prod || prod.status !== "active") return { ok: false, error: "This product is no longer available." };
    const variants = prod.product_variants as { id: string; color_name: string | null; size: string | null; stock: number }[];
    let variant: (typeof variants)[number] | null = null;
    if (variants.length) {
      variant = variants.find((v) => v.id === d.variantId) ?? null;
      if (!variant) return { ok: false, error: "Choose a color and size." };
      if (variant.stock < d.qty) return { ok: false, error: `Only ${variant.stock} left in that option.` };
    }

    const subtotal = Number(offer.price);
    const { data: zone } = await db.from("shipping_zones").select("name, fee, free_over").eq("id", d.zoneId).eq("active", true).maybeSingle();
    if (!zone) return { ok: false, error: "Choose a delivery area." };
    const shipping = zone.free_over != null && subtotal >= Number(zone.free_over) ? 0 : Number(zone.fee);
    const total = subtotal + shipping;

    const h = await headers();
    const rawIp = (h.get("x-forwarded-for") ?? "").split(",")[0].trim();
    const ip = /^[0-9a-fA-F:.]{3,45}$/.test(rawIp) ? rawIp : "unknown";
    const fraud = await checkFraud({ phone, ip, email: "", total });
    if (fraud.block) return { ok: false, error: GENERIC };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const label = variant ? [variant.color_name, variant.size].filter(Boolean).join(", ") : "";
    const { data, error } = await db.rpc("create_order", {
      o: {
        user_id: user?.id ?? "", name: d.name, phone, email: "", payment_method: "cod", subtotal, shipping_fee: shipping, discount: 0, total,
        coupon_code: "", shipping_address: { district: d.district, address: d.address }, risk_score: fraud.score, zone: zone.name as string, ip, note: d.note,
      },
      items: [{ product_id: l.product_id, variant_id: variant?.id ?? "", name: label ? `${prod.name} (${label})` : prod.name, unit_price: Math.round((subtotal / d.qty) * 100) / 100, qty: d.qty }],
    });
    if (error) return { ok: false, error: error.message.includes("OUT_OF_STOCK") ? "Sorry, that just sold out." : "Something went wrong placing your order. Please try again." };
    return { ok: true, id: (data as { id: string }).id };
  } catch {
    return { ok: false, error: "Ordering is not available right now." };
  }
}
