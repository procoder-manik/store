import { NextResponse } from "next/server";
import { DOC_HEADERS, staffOrNull } from "@/lib/doc-auth";
import { labelHtml, type InvoiceOrder } from "@/lib/invoice";
import { getPublicSettings } from "@/lib/settings";

/** Labels for every order in one status (default: confirmed), oldest first, up to 100 at a time. */
export async function GET(req: Request) {
  const a = await staffOrNull();
  if (a.error) return new NextResponse(a.error, { status: a.status });
  const sp = new URL(req.url).searchParams;
  const status = ["pending", "confirmed", "processing", "shipped"].includes(sp.get("status") ?? "") ? (sp.get("status") as string) : "confirmed";
  const { data } = await a.supabase.from("orders").select("*, order_items(name_snapshot, unit_price, qty)").eq("status", status).order("created_at").limit(100);
  const { brand } = await getPublicSettings();
  if (!data?.length) return new NextResponse(`<p style="font-family:sans-serif;padding:24px">No ${status} orders to print.</p>`, { headers: DOC_HEADERS });
  return new NextResponse(labelHtml(data as InvoiceOrder[], brand), { headers: DOC_HEADERS });
}
