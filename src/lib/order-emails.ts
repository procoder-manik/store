import "server-only";
import { SITE_URL, formatPrice } from "@/lib/config";
import { sendAutoEmail, type AutoKey } from "@/lib/auto-emails";

export type OrderEmailKind = "placed" | "confirmed" | "processing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled" | "returned";
type Info = { email: string; name: string; orderNo: number; total: number; items?: string[]; paid?: boolean; courier?: string; trackingCode?: string; orderId?: string; reason?: string };

/** Order emails use the wording you set in Email marketing, Automatic emails. A failure never blocks an order. */
export async function sendOrderEmail(kind: OrderEmailKind, o: Info) {
  if (!o.email) return;
  try {
    await sendAutoEmail(`order_${kind}` as AutoKey, o.email, {
      name: o.name.split(" ")[0] || "there",
      order_no: String(o.orderNo),
      total: formatPrice(o.total),
      items: (o.items ?? []).map((i) => `- ${i}`).join("\n"),
      payment: o.paid ? `Paid online: ${formatPrice(o.total)}` : `Total to pay on delivery: ${formatPrice(o.total)}`,
      payment_note: o.paid ? "Your payment is already received." : `Please keep ${formatPrice(o.total)} ready to pay on delivery.`,
      courier: o.courier ? `Courier: ${o.courier}${o.trackingCode ? `, tracking number ${o.trackingCode}` : ""}.` : "",
      reason: o.reason ?? "",
      invoice_line: o.orderId ? `Your invoice: ${SITE_URL}/invoice/${o.orderId}` : "",
    });
  } catch (e) {
    console.error("[email] order email failed:", (e as Error).message);
  }
}
