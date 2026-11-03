import "server-only";
import { deliveryFee } from "@/lib/free-delivery";
import { getPublicSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";

export type CartInput = { productId: string; variantId?: string; qty: number }[];
export type Line = { productId: string; variantId: string | null; name: string; unitPrice: number; qty: number; preorder?: boolean; categoryId?: string | null };

// A coupon can be limited to certain products or categories. With none set, it works on any cart.
function cartHasCouponItems(c: { product_ids?: string[] | null; category_ids?: string[] | null }, lines: Line[]): boolean {
  const pids = c.product_ids ?? [];
  const cids = c.category_ids ?? [];
  if (pids.length === 0 && cids.length === 0) return true;
  return lines.some((l) => pids.includes(l.productId) || (l.categoryId != null && cids.includes(l.categoryId)));
}
export type Priced =
  | { ok: true; lines: Line[]; subtotal: number; shipping: number; discount: number; bundleDiscount: number; total: number; couponCode: string | null; couponError?: string; zoneName: string; hasPreorder: boolean; mustPartial?: boolean; creditUsed?: number; creditBalance?: number }
  | { ok: false; error: string };

type Prod = { name: string; base_price: number | string; status: string; preorder?: boolean; category_id?: string | null };
type VRow = { id: string; product_id: string; color_name: string | null; size: string | null; price_delta: number | string; stock: number; products: Prod | Prod[] | null };
type PRow = Prod & { id: string; product_variants: { id: string }[] };

const GONE = "An item in your cart is no longer available.";

/** Recomputes every price on the server from the database. Client prices are never trusted. */
export async function priceCart(items: CartInput, zoneId: string, couponRaw?: string, bump = false): Promise<Priced> {
  const db = createAdminClient();

  const merged = new Map<string, { productId: string; variantId?: string; qty: number }>();
  for (const i of items) {
    const k = i.variantId ?? `p:${i.productId}`;
    const ex = merged.get(k);
    if (ex) ex.qty += i.qty;
    else merged.set(k, { ...i });
  }
  const list = [...merged.values()];
  const lines: Line[] = [];

  const withVariant = list.filter((i) => i.variantId);
  if (withVariant.length) {
    const { data, error } = await db
      .from("product_variants")
      .select("id, product_id, color_name, size, price_delta, stock, products(name, base_price, status, preorder, category_id)")
      .in("id", withVariant.map((i) => i.variantId as string));
    if (error) return { ok: false, error: "Could not load your cart. Please try again." };
    const byId = new Map(((data ?? []) as unknown as VRow[]).map((v) => [v.id, v]));
    for (const i of withVariant) {
      const v = byId.get(i.variantId as string);
      const prod = Array.isArray(v?.products) ? v?.products[0] : v?.products;
      if (!v || !prod || prod.status !== "active" || v.product_id !== i.productId) return { ok: false, error: GONE };
      const label = [v.color_name, v.size].filter(Boolean).join(", ");
      if (v.stock < i.qty) return { ok: false, error: `${prod.name}${label ? ` (${label})` : ""}: only ${v.stock} left in stock.` };
      const shown = label ? `${prod.name} (${label})` : prod.name;
      lines.push({ productId: v.product_id, variantId: v.id, name: prod.preorder ? `${shown} [Pre-order]` : shown, unitPrice: Number(prod.base_price) + Number(v.price_delta), qty: i.qty, preorder: !!prod.preorder, categoryId: prod.category_id ?? null });
    }
  }

  const plain = list.filter((i) => !i.variantId);
  if (plain.length) {
    const { data } = await db.from("products").select("id, name, base_price, status, preorder, category_id, product_variants(id)").in("id", plain.map((i) => i.productId));
    const byId = new Map(((data ?? []) as unknown as PRow[]).map((p) => [p.id, p]));
    for (const i of plain) {
      const p = byId.get(i.productId);
      if (!p || p.status !== "active") return { ok: false, error: GONE };
      if (p.product_variants.length > 0) return { ok: false, error: `${p.name}: choose a color and size again.` };
      lines.push({ productId: p.id, variantId: null, name: p.preorder ? `${p.name} [Pre-order]` : p.name, unitPrice: Number(p.base_price), qty: i.qty, preorder: !!p.preorder, categoryId: p.category_id ?? null });
    }
  }

  if (bump) {
    const { data: row } = await db.from("site_settings").select("value").eq("key", "bump").maybeSingle();
    const cfg = (row?.value ?? {}) as { enabled?: boolean; variantId?: string; price?: number | null };
    if (cfg.enabled && cfg.variantId && !lines.some((l) => l.variantId === cfg.variantId)) {
      const { data } = await db.from("product_variants").select("id, product_id, color_name, size, price_delta, stock, products(name, base_price, status)").eq("id", cfg.variantId).maybeSingle();
      const bv = data as unknown as VRow | null;
      const bp = Array.isArray(bv?.products) ? bv?.products[0] : bv?.products;
      if (bv && bp && bp.status === "active" && bv.stock >= 1) {
        const label = [bv.color_name, bv.size].filter(Boolean).join(", ");
        lines.push({ productId: bv.product_id, variantId: bv.id, name: label ? `${bp.name} (${label})` : bp.name, unitPrice: cfg.price != null ? Number(cfg.price) : Number(bp.base_price) + Number(bv.price_delta), qty: 1 });
      }
    }
  }

  const subtotal = lines.reduce((n, l) => n + l.unitPrice * l.qty, 0);

  const { data: zone } = await db.from("shipping_zones").select("name, fee, free_over").eq("id", zoneId).eq("active", true).maybeSingle();
  if (!zone) return { ok: false, error: "Choose a delivery area." };
  let shipping = deliveryFee(zoneId, zone, subtotal, (await getPublicSettings()).freeDelivery);

  let bundleDiscount = 0;
  const { data: bundles, error: bundleErr } = await db.from("bundles").select("product_ids, discount_percent").eq("active", true);
  if (!bundleErr) {
    for (const b of (bundles ?? []) as { product_ids: string[]; discount_percent: number | string }[]) {
      const sets = Math.min(...b.product_ids.map((pid) => lines.filter((l) => l.productId === pid).reduce((n, l) => n + l.qty, 0)));
      if (sets < 1) continue;
      const value = b.product_ids.reduce((n, pid) => n + Math.min(...lines.filter((l) => l.productId === pid).map((l) => l.unitPrice)) * sets, 0);
      bundleDiscount = Math.max(bundleDiscount, Math.round((value * Number(b.discount_percent)) / 100));
    }
  }

  let discount = 0;
  let couponCode: string | null = null;
  let couponError: string | undefined;
  const code = couponRaw?.trim().toUpperCase();
  if (code) {
    const { data: c } = await db.from("coupons").select("*").eq("code", code).maybeSingle();
    const now = Date.now();
    if (!c || !c.active) couponError = "That coupon code is not valid.";
    else if (c.starts_at && new Date(c.starts_at).getTime() > now) couponError = "That coupon is not active yet.";
    else if (c.ends_at && new Date(c.ends_at).getTime() < now) couponError = "That coupon has expired.";
    else if (c.max_uses != null && c.used_count >= c.max_uses) couponError = "That coupon has been fully used.";
    else if (subtotal < Number(c.min_subtotal)) couponError = `Spend ৳${Number(c.min_subtotal).toLocaleString("en-US")} or more to use this coupon.`;
    else if (!cartHasCouponItems(c, lines)) couponError = "This coupon only works on certain items, which are not in your cart.";
    else {
      const raw = c.type === "percent" ? Math.round((subtotal * Number(c.value)) / 100) : Number(c.value);
      discount = Math.min(raw, subtotal);
      if (c.free_shipping) shipping = 0; // the coupon covers delivery
      couponCode = c.code as string;
    }
  }

  const allDiscount = Math.min(subtotal, discount + bundleDiscount);
  return { ok: true, lines, subtotal, shipping, discount: allDiscount, bundleDiscount, total: subtotal + shipping - allDiscount, couponCode, couponError, zoneName: zone.name as string, hasPreorder: lines.some((l) => l.preorder) };
}

/**
 * The per-customer coupon rules, checked only when the order is placed because they need to know who the customer is.
 * Returns a message to show the customer, or null when the coupon is allowed. Guests are matched by phone, members also by account.
 */
export async function checkCustomerCoupon(code: string, who: { userId?: string | null; phone?: string | null }): Promise<string | null> {
  const db = createAdminClient();
  const { data: c } = await db.from("coupons").select("first_order_only, per_customer_limit").eq("code", code.toUpperCase()).maybeSingle();
  if (!c || (!c.first_order_only && c.per_customer_limit == null)) return null;
  const parts = [who.userId ? `user_id.eq.${who.userId}` : "", who.phone ? `guest_phone.eq.${who.phone}` : ""].filter(Boolean);
  if (parts.length === 0) return null; // can't tell who this is, so let it through
  const mine = parts.join(",");
  if (c.first_order_only) {
    const { count } = await db.from("orders").select("id", { count: "exact", head: true }).or(mine);
    if ((count ?? 0) > 0) return "This coupon is only for your first order.";
  }
  if (c.per_customer_limit != null) {
    const { count } = await db.from("orders").select("id", { count: "exact", head: true }).eq("coupon_code", code.toUpperCase()).or(mine);
    if ((count ?? 0) >= Number(c.per_customer_limit)) return "You have already used this coupon the most times allowed.";
  }
  return null;
}
