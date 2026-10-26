import { NextResponse } from "next/server";
import { mfaRequired } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

const cell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // stops spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
};
const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!p || !["staff", "manager", "super_admin"].includes(p.role)) return new NextResponse("Forbidden", { status: 403 });
  if (mfaRequired()) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") return new NextResponse("Two-step verification required", { status: 403 });
  }
  const sp = new URL(req.url).searchParams;
  let q = supabase.from("orders").select("order_no, created_at, guest_name, guest_phone, guest_email, shipping_address, subtotal, shipping_fee, discount, total, payment_method, payment_status, status, courier, tracking_code, source, note, order_items(name_snapshot, qty)").order("created_at", { ascending: false }).limit(5000);
  const status = sp.get("status");
  if (status && STATUSES.includes(status)) q = q.eq("status", status);
  const days = Number(sp.get("days"));
  if (days > 0 && days <= 3650) q = q.gte("created_at", new Date(Date.now() - days * 864e5).toISOString());
  const { data } = await q;

  const head = ["Order", "Date", "Customer", "Phone", "Email", "District", "Address", "Items", "Subtotal", "Delivery", "Discount", "Total", "Payment", "Payment status", "Status", "Courier", "Tracking", "Source", "Note"];
  const rows = (data ?? []).map((o) => {
    const a = (o.shipping_address ?? {}) as { district?: string; address?: string };
    const items = (o.order_items as { name_snapshot: string; qty: number }[]).map((i) => `${i.name_snapshot} x ${i.qty}`).join("; ");
    return [o.order_no, o.created_at, o.guest_name, o.guest_phone, o.guest_email, a.district, a.address, items, o.subtotal, o.shipping_fee, o.discount, o.total, o.payment_method, o.payment_status, o.status, o.courier, o.tracking_code, o.source, o.note];
  });
  const csv = "\uFEFF" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\n");
  return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="orders.csv"' } });
}
