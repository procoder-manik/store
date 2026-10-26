import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mfaRequired } from "@/lib/admin";

const cell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // stops spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
};

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
  const type = new URL(req.url).searchParams.get("type") === "leads" ? "leads" : "customers";
  let head: string[], rows: unknown[][];
  if (type === "leads") {
    const { data } = await supabase.from("leads").select("name, phone, email, source, status, created_at").order("created_at", { ascending: false }).limit(5000);
    head = ["Name", "Phone", "Email", "Source", "Status", "Added"];
    rows = (data ?? []).map((l) => [l.name, l.phone, l.email, l.source, l.status, l.created_at]);
  } else {
    const { data } = await supabase.rpc("crm_customers");
    head = ["Name", "Phone", "Email", "Orders", "Spent", "Last order", "Segment"];
    rows = ((data ?? []) as Record<string, unknown>[]).map((c) => [c.name, c.phone, c.email, c.orders, c.spent, c.last_order, c.segment]);
  }
  const csv = [head, ...rows].map((r) => r.map(cell).join(",")).join("\n");
  return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${type}.csv"` } });
}
