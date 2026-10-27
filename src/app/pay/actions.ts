"use server";

import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { sendOrderEmail } from "@/lib/order-emails";
import { startPayment } from "@/lib/sslcommerz";
import { createAdminClient } from "@/lib/supabase/admin";

export async function startPaymentAction(orderId: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const id = z.string().uuid().safeParse(orderId);
  if (!id.success) return { ok: false, error: "Order not found." };
  if (!(await rateLimit(`pay:${await clientIp()}`, 10, 600))) return { ok: false, error: "Too many tries. Please wait a few minutes." };
  return startPayment(id.data);
}

/** Lets a customer whose online payment failed finish the same order with cash on delivery. */
export async function switchToCod(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const id = z.string().uuid().safeParse(orderId);
  if (!id.success) return { ok: false, error: "Order not found." };
  if (!(await rateLimit(`pay:${await clientIp()}`, 10, 600))) return { ok: false, error: "Too many tries. Please wait a few minutes." };
  const db = createAdminClient();
  const { data } = await db.from("orders").update({ payment_method: "cod" }).eq("id", id.data).eq("payment_method", "sslcommerz").eq("payment_status", "unpaid").eq("status", "pending").select("order_no, total, guest_name, guest_email, order_items(name_snapshot, qty)").maybeSingle();
  if (!data) return { ok: false, error: "This order can no longer be changed." };
  await db.from("payments").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("order_id", id.data).eq("status", "initiated");
  if (data.guest_email) await sendOrderEmail("placed", { email: data.guest_email as string, name: data.guest_name as string, orderId: id.data, orderNo: Number(data.order_no), total: Number(data.total), items: (data.order_items as { name_snapshot: string; qty: number }[]).map((i) => `${i.name_snapshot} x ${i.qty}`) });
  return { ok: true };
}
