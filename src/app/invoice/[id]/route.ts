import { NextResponse } from "next/server";
import { DOC_HEADERS } from "@/lib/doc-auth";
import { invoiceHtml, type InvoiceOrder } from "@/lib/invoice";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { getPublicSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";

/** A customer's own invoice. The order address is a long random code, so only people who have the link can open it. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
  if (!(await rateLimit(`inv:${await clientIp()}`, 60, 600))) return new NextResponse("Too many requests", { status: 429 });
  try {
    const { data } = await createAdminClient().from("orders").select("*, order_items(name_snapshot, unit_price, qty)").eq("id", id).maybeSingle();
    if (!data) return new NextResponse("Not found", { status: 404 });
    const { brand, contact } = await getPublicSettings();
    return new NextResponse(invoiceHtml(data as InvoiceOrder, brand, contact), { headers: DOC_HEADERS });
  } catch {
    return new NextResponse("Invoices are not available right now.", { status: 503 });
  }
}
