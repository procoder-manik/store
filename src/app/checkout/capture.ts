"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/utils";
import { clientIp, rateLimit } from "@/lib/ratelimit";

const schema = z.object({
  name: z.string().trim().max(80),
  phone: z.string().trim().max(20),
  email: z.string().trim().max(120),
  items: z.array(z.object({ id: z.string().max(64), variantId: z.string().max(64).optional(), name: z.string().max(160), color: z.string().max(40), size: z.string().max(20), price: z.number().min(0).max(10_000_000), qty: z.number().int().min(1).max(10) })).min(1).max(30),
});

/** Saves a cart once a visitor has typed contact details, so staff can follow up if they leave. */
export async function captureCart(input: unknown): Promise<void> {
  const p = schema.safeParse(input);
  if (!p.success) return;
  const phone = normalizePhone(p.data.phone);
  const email = z.string().email().safeParse(p.data.email).success ? p.data.email.toLowerCase() : null;
  if (!phone && !email) return;
  if (!(await rateLimit(`cap:${await clientIp()}`, 40, 600))) return;
  try {
    const db = createAdminClient();
    const total = p.data.items.reduce((n, i) => n + i.price * i.qty, 0);
    let q = db.from("abandoned_carts").select("id").eq("recovered", false).limit(1);
    q = phone ? q.eq("phone", phone) : q.eq("email", email as string);
    const { data: ex } = await q;
    const row = { name: p.data.name || null, phone, email, items: p.data.items, total, updated_at: new Date().toISOString() };
    if (ex?.length) await db.from("abandoned_carts").update(row).eq("id", ex[0].id);
    else await db.from("abandoned_carts").insert(row);
  } catch {
    // Capturing is best effort and must never disturb checkout.
  }
}
