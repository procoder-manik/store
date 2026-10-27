import "server-only";
import { SITE_URL } from "@/lib/config";
import { sendAutoEmail, money } from "@/lib/auto-emails";

type Info = { email: string; name: string; orderNo: number; total: number; items?: string[]; paid?: boolean; courier?: string; trackingCode?: string; orderId?: string };

/** Order emails use the wording you set in Email marketing, Automatic emails. A failure never blocks an order. */
export async function sendOrderEmail(kind: "placed" | "shipped" | "delivered", o: Info) {
  if (!o.email) return;
  try {
    await sendAutoEmail(`order_${kind}` as "order_placed", o.email, {
      name: o.name.split(" ")[0] || "there",
      order_no: String(o.orderNo),
      total: money(o.total),
      items: (o.items ?? []).map((i) => `- ${i}`).join("\n"),
      payment: o.paid ? `Paid online: ${money(o.total)}` : `Total to pay on delivery: ${money(o.total)}`,
      payment_note: o.paid ? "Your payment is already received." : `Please keep ${money(o.total)} ready to pay on delivery.`,
      courier: o.courier ? `Courier: ${o.courier}${o.trackingCode ? `, tracking number ${o.trackingCode}` : ""}.` : "",
      invoice_line: o.orderId ? `Your invoice: ${SITE_URL}/invoice/${o.orderId}` : "",
    });
  } catch (e) {
    console.error("[email] order email failed:", (e as Error).message);
  }
}
