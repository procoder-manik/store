import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/config";
import { markUnfinished, settle } from "@/lib/sslcommerz";

export const dynamic = "force-dynamic";

const go = (path: string) => NextResponse.redirect(`${SITE_URL}${path}`, 303);

async function fields(req: Request) {
  try {
    const f = await req.formData();
    return { tran: String(f.get("tran_id") ?? "").slice(0, 80), val: String(f.get("val_id") ?? "").slice(0, 80) };
  } catch {
    return { tran: "", val: "" };
  }
}

// The gateway sends the customer back with a POST. Every result is re-checked with the gateway before an order is marked paid.
export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  const { tran, val } = await fields(req);
  try {
    return await handle(action, tran, val);
  } catch {
    // A callback must never show an error page to a customer who just paid.
    return action === "ipn" ? NextResponse.json({ received: false }, { status: 500 }) : go("/");
  }
}

async function handle(action: string, tran: string, val: string) {

  if (action === "success") {
    const r = await settle(tran, val);
    if (!r) return go("/");
    if (r.paid || r.review) return go(`/thank-you/${r.orderId}`);
    return go(`/pay/${r.orderId}?s=failed`);
  }
  if (action === "fail" || action === "cancel") {
    const id = await markUnfinished(tran, action === "fail" ? "failed" : "cancelled");
    return go(id ? `/pay/${id}?s=${action === "fail" ? "failed" : "cancelled"}` : "/");
  }
  if (action === "ipn") {
    await settle(tran, val);
    return NextResponse.json({ received: true });
  }
  return new NextResponse("Not found", { status: 404 });
}

export async function GET() {
  return go("/");
}
