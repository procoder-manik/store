"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { blocksSchema } from "@/lib/blocks";
import { checkFraud } from "@/lib/fraud";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/utils";

const schema = z.object({
  slug: z.string().max(80),
  selections: z.array(z.object({ offerId: z.string().max(40), picks: z.record(z.string().uuid(), z.string().uuid()) })).min(1, "Choose at least one offer").max(8),
  zoneId: z.string().uuid("Choose a delivery area"),
  name: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z.string().trim().max(20),
  district: z.string().trim().min(2, "Enter your district").max(60),
  address: z.string().trim().min(6, "Enter your full address").max(300),
  note: z.string().trim().max(300),
  website: z.string(),
});

const GENERIC = "We could not place this order. Please contact us to complete it.";
type Placed = { ok: true; id: string } | { ok: false; error: string };
type V = { id: string; color_name: string | null; size: string | null; price_delta: number | string; stock: number };
type P = { id: string; name: string; base_price: number | string; status: string; product_variants: V[] };

/** Every price and every stock check is done here from the saved page and the catalog. The browser only says what was picked. */
export async function placeLandingOrderV2(input: unknown): Promise<Placed> {
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const d = p.data;
  if (d.website) return { ok: false, error: GENERIC };
  const phone = normalizePhone(d.phone);
  if (!phone) return { ok: false, error: "Enter a valid Bangladeshi mobile number, like 01712345678." };
  if (!(await rateLimit(`order:${await clientIp()}`, 6, 600))) return { ok: false, error: "Too many orders from this connection. Please wait a few minutes or call us." };

  try {
    const db = createAdminClient();
    const { data: page } = await db.from("pages").select("blocks, status, kind").eq("slug", d.slug).maybeSingle();
    if (!page || page.status !== "active" || page.kind !== "landing") return { ok: false, error: "This offer is no longer available." };
    const parsed = blocksSchema.safeParse(page.blocks);
    const block = parsed.success ? parsed.data.find((b) => b.type === "order") : undefined;
    if (!block || block.type !== "order") return { ok: false, error: "This offer is no longer available." };
    if (!block.multi && d.selections.length > 1) return { ok: false, error: "Choose one offer." };

    const chosen = d.selections.map((s) => ({ s, offer: block.offers.find((o) => o.id === s.offerId) }));
    if (chosen.some((c) => !c.offer) || new Set(d.selections.map((s) => s.offerId)).size !== d.selections.length) return { ok: false, error: "One of the offers is no longer available." };

    const ids = [...new Set(chosen.flatMap((c) => c.offer!.items.map((i) => i.productId)))];
    const { data: prods } = await db.from("products").select("id, name, base_price, status, product_variants(id, color_name, size, price_delta, stock)").in("id", ids);
    const byId = new Map(((prods ?? []) as unknown as P[]).map((x) => [x.id, x]));

    const need = new Map<string, number>();
    const lines: { productId: string; variantId: string | null; name: string; qty: number; unit: number }[] = [];
    let subtotal = 0;
    for (const { s, offer } of chosen) {
      const part: { productId: string; variantId: string | null; name: string; qty: number; base: number }[] = [];
      for (const it of offer!.items) {
        const prod = byId.get(it.productId);
        if (!prod || prod.status !== "active") return { ok: false, error: "A product in this offer is no longer available." };
        let v: V | null = null;
        if (prod.product_variants.length) {
          v = prod.product_variants.find((x) => x.id === s.picks[it.productId]) ?? null;
          if (!v) return { ok: false, error: `Choose a color and size for ${prod.name}.` };
          need.set(v.id, (need.get(v.id) ?? 0) + it.qty);
          if ((need.get(v.id) ?? 0) > v.stock) return { ok: false, error: `${prod.name}: only ${v.stock} left in that option.` };
        }
        const label = v ? [v.color_name, v.size].filter(Boolean).join(", ") : "";
        part.push({ productId: prod.id, variantId: v?.id ?? null, name: label ? `${prod.name} (${label})` : prod.name, qty: it.qty, base: (Number(prod.base_price) + Number(v?.price_delta ?? 0)) * it.qty });
      }
      // The offer price is shared between its products in proportion to their normal prices.
      const worth = part.reduce((n, x) => n + x.base, 0) || 1;
      let left = offer!.price;
      part.forEach((x, k) => {
        const share = k === part.length - 1 ? left : Math.round((x.base / worth) * offer!.price * 100) / 100;
        left = Math.round((left - share) * 100) / 100;
        lines.push({ productId: x.productId, variantId: x.variantId, name: x.name, qty: x.qty, unit: Math.round((share / x.qty) * 100) / 100 });
      });
      subtotal += offer!.price;
    }

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
    const { data, error } = await db.rpc("create_order", {
      o: { user_id: user?.id ?? "", name: d.name, phone, email: "", payment_method: "cod", subtotal, shipping_fee: shipping, discount: 0, total, coupon_code: "", shipping_address: { district: d.district, address: d.address }, risk_score: fraud.score, zone: zone.name as string, ip, note: d.note },
      items: lines.map((l) => ({ product_id: l.productId, variant_id: l.variantId ?? "", name: l.name, unit_price: l.unit, qty: l.qty })),
    });
    if (error) return { ok: false, error: error.message.includes("OUT_OF_STOCK") ? "Sorry, that just sold out." : "Something went wrong placing your order. Please try again." };
    return { ok: true, id: (data as { id: string }).id };
  } catch {
    return { ok: false, error: "Ordering is not available right now." };
  }
}
