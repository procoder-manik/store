import "server-only";
import { courierCreds } from "@/lib/courier-config";
import { courierDef, courierName } from "@/lib/couriers";

export type Parcel = { invoice: string; name: string; phone: string; address: string; cod: number; note: string };
export type BookResult = { ok: true; consignmentId: string; trackingCode: string } | { ok: false; error: string };
export type TestResult = { ok: boolean; error?: string; detail?: string };

/** Creates a parcel with the chosen courier. Only couriers marked autoBook reach the courier's API;
 *  the rest are booked in the courier's own panel, with the tracking number pasted back here. */
export async function bookWithCourier(id: string, p: Parcel): Promise<BookResult> {
  const def = courierDef(id);
  const creds = await courierCreds(id);
  if (!creds) return { ok: false, error: `${courierName(id)} is not connected. Add its keys under Delivery partners.` };
  if (id === "steadfast") return bookSteadfast(creds.values, p);
  return { ok: false, error: `${def?.name ?? id} parcels are booked in their own panel. Book it there, then paste the tracking number on this order.` };
}

async function bookSteadfast(v: Record<string, string>, p: Parcel): Promise<BookResult> {
  try {
    const res = await fetch("https://portal.packzy.com/api/v1/create_order", {
      method: "POST",
      headers: { "Api-Key": v.api_key, "Secret-Key": v.secret_key, "Content-Type": "application/json" },
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

/** Checks the saved keys against the courier, where the courier offers a way to do so. */
export async function testCourier(id: string): Promise<TestResult> {
  const creds = await courierCreds(id);
  if (!creds) return { ok: false, error: "Save the keys first." };
  if (id === "steadfast") {
    try {
      const res = await fetch("https://portal.packzy.com/api/v1/get_balance", { headers: { "Api-Key": creds.values.api_key, "Secret-Key": creds.values.secret_key }, cache: "no-store" });
      const j = (await res.json()) as { status?: number; current_balance?: number };
      if (j.status === 200) return { ok: true, detail: j.current_balance != null ? `Connected. Current balance ${j.current_balance}.` : "Keys accepted." };
      return { ok: false, error: "Steadfast did not accept these keys." };
    } catch {
      return { ok: false, error: "Could not reach Steadfast." };
    }
  }
  if (id === "pathao") {
    const base = creds.live ? "https://api-hermes.pathao.com" : "https://courier-api-sandbox.pathao.com";
    try {
      const res = await fetch(`${base}/aladdin/api/v1/issue-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ client_id: creds.values.client_id, client_secret: creds.values.client_secret, grant_type: "password", username: creds.values.username, password: creds.values.password }),
        cache: "no-store",
      });
      const j = (await res.json()) as { access_token?: string; message?: unknown };
      if (j.access_token) return { ok: true, detail: `Pathao accepted the credentials in ${creds.live ? "live" : "test"} mode.` };
      return { ok: false, error: typeof j.message === "string" ? `Pathao said: ${j.message}` : "Pathao did not accept these credentials." };
    } catch {
      return { ok: false, error: "Could not reach Pathao." };
    }
  }
  return { ok: false, error: "This courier has no connection test. Save the keys, book a parcel in their panel, and paste the tracking number here." };
}
