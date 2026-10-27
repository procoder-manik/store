import { NextResponse } from "next/server";
import { DOC_HEADERS, staffOrNull } from "@/lib/doc-auth";
import { invoiceHtml, type InvoiceOrder } from "@/lib/invoice";
import { getPublicSettings } from "@/lib/settings";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
  const a = await staffOrNull();
  if (a.error) return new NextResponse(a.error, { status: a.status });
  const { data } = await a.supabase.from("orders").select("*, order_items(name_snapshot, unit_price, qty)").eq("id", id).maybeSingle();
  if (!data) return new NextResponse("Not found", { status: 404 });
  const { brand, contact } = await getPublicSettings();
  return new NextResponse(invoiceHtml(data as InvoiceOrder, brand, contact), { headers: DOC_HEADERS });
}
