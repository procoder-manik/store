import "server-only";

export const steadfastConfigured = () => !!(process.env.STEADFAST_API_KEY && process.env.STEADFAST_SECRET_KEY);

/** Books a parcel with Steadfast. The cash to collect is the order total, or 0 if it was already paid online. */
export async function bookSteadfastParcel(p: { invoice: string; name: string; phone: string; address: string; cod: number; note: string }): Promise<{ ok: true; consignmentId: string; trackingCode: string } | { ok: false; error: string }> {
  if (!steadfastConfigured()) return { ok: false, error: "Add STEADFAST_API_KEY and STEADFAST_SECRET_KEY to .env.local first." };
  try {
    const res = await fetch("https://portal.packzy.com/api/v1/create_order", {
      method: "POST",
      headers: { "Api-Key": process.env.STEADFAST_API_KEY as string, "Secret-Key": process.env.STEADFAST_SECRET_KEY as string, "Content-Type": "application/json" },
      body: JSON.stringify({ invoice: p.invoice, recipient_name: p.name, recipient_phone: p.phone, recipient_address: p.address.slice(0, 250), cod_amount: p.cod, note: p.note.slice(0, 200) }),
      cache: "no-store",
    });
    const j = (await res.json()) as { status?: number; message?: string; consignment?: { consignment_id?: number | string; tracking_code?: string } };
    if (j.status === 200 && j.consignment?.consignment_id) return { ok: true, consignmentId: String(j.consignment.consignment_id), trackingCode: j.consignment.tracking_code ?? "" };
    return { ok: false, error: `Steadfast said: ${j.message ?? "the parcel was not created"}` };
  } catch {
    return { ok: false, error: "Could not reach Steadfast. Try again in a moment." };
  }
}
