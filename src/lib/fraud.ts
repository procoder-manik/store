import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type Input = { phone: string; ip: string; email: string; total: number };
export type FraudReason = "blacklist" | "phone_velocity" | "ip_velocity";
export type FraudResult = { block: boolean; score: number; reason?: FraudReason };

const since = (ms: number) => new Date(Date.now() - ms).toISOString();

/** Blacklist, velocity limits and a simple risk score. Blocks are generic so attackers learn nothing. */
export async function checkFraud({ phone, ip, email, total }: Input): Promise<FraudResult> {
  const db = createAdminClient();
  const listed = async (kind: string, value: string) => {
    if (!value) return false;
    const { data } = await db.from("fraud_blacklist").select("id").eq("kind", kind).eq("value", value).limit(1);
    return (data?.length ?? 0) > 0;
  };
  const count = async (col: string, value: string, ms: number, statuses?: string[]) => {
    let q = db.from("orders").select("id", { count: "exact", head: true }).eq(col, value).gte("created_at", since(ms));
    if (statuses) q = q.in("status", statuses);
    const { count: n } = await q;
    return n ?? 0;
  };

  const [bPhone, bIp, bEmail, phone24, ip1h, bad, delivered] = await Promise.all([
    listed("phone", phone),
    listed("ip", ip),
    listed("email", email),
    count("guest_phone", phone, 24 * 3600e3),
    ip === "unknown" ? Promise.resolve(0) : count("ip", ip, 3600e3),
    count("guest_phone", phone, 365 * 24 * 3600e3, ["cancelled", "returned"]),
    count("guest_phone", phone, 365 * 24 * 3600e3, ["delivered"]),
  ]);

  // Say which rule fired so the server log (and a signed-in staff member testing the store) can see why.
  if (bPhone || bIp || bEmail) return { block: true, score: 100, reason: "blacklist" };
  if (phone24 >= 3) return { block: true, score: 100, reason: "phone_velocity" };
  if (ip1h >= 8) return { block: true, score: 100, reason: "ip_velocity" };

  let score = 0;
  if (bad >= 2) score += 40;
  else if (bad === 1) score += 15;
  if (phone24 >= 1) score += 20;
  if (delivered === 0 && total >= 15000) score += 15;
  return { block: false, score: Math.min(score, 99) };
}
