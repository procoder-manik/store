"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/utils";
import { clientIp, rateLimit } from "@/lib/ratelimit";

const schema = z.object({ orderNo: z.coerce.number().int().min(1).max(999999999), phone: z.string().trim().max(20) });
type Result = { ok: true; orderNo: number; status: string; total: number; courier: string | null; trackingCode: string | null; events: { status: string; created_at: string }[] } | { ok: false; error: string };

/** Needs both the order number and the phone used at checkout, so order details are not guessable. */
export async function trackOrder(input: unknown): Promise<Result> {
  const p = schema.safeParse(input);
  const phone = p.success ? normalizePhone(p.data.phone) : null;
  if (!p.success || !phone) return { ok: false, error: "Enter your order number and the mobile number you used when ordering." };
  if (!(await rateLimit(`track:${await clientIp()}`, 15, 600))) return { ok: false, error: "Too many tries. Please wait a few minutes." };
  try {
    const { data } = await createAdminClient().from("orders").select("order_no, status, total, courier, tracking_code, order_events(status, created_at)").eq("order_no", p.data.orderNo).eq("guest_phone", phone).maybeSingle();
    if (!data) return { ok: false, error: "We could not find an order with those details." };
    return { ok: true, orderNo: Number(data.order_no), status: data.status as string, total: Number(data.total), courier: (data.courier as string) ?? null, trackingCode: (data.tracking_code as string) ?? null, events: data.order_events as { status: string; created_at: string }[] };
  } catch {
    return { ok: false, error: "Tracking is not available right now." };
  }
}
