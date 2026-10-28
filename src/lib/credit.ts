import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** How much of an order store credit may cover, and the reward a referrer earns. */
export const CREDIT = {
  rewardPercent: 5,          // the referrer gets this share of the order subtotal
  rewardMax: 500,            // never more than this from one order
  maxShareOfOrder: 0.3,      // credit can pay at most this much of one order
  minBalanceToUse: 50,       // below this, credit is saved for later
};

export async function creditBalance(userId: string): Promise<number> {
  try {
    const { data } = await createAdminClient().rpc("credit_balance", { p_user: userId });
    return Math.max(0, Number(data ?? 0));
  } catch {
    return 0;
  }
}

/** The most credit that may be used on an order of this size. */
export function usableCredit(balance: number, orderTotalBeforeCredit: number) {
  if (balance < CREDIT.minBalanceToUse) return 0;
  return Math.max(0, Math.min(balance, Math.floor(orderTotalBeforeCredit * CREDIT.maxShareOfOrder)));
}

/** Finds the account behind a referral code. */
export async function referrerFromCode(code: string): Promise<string | null> {
  const c = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(c)) return null;
  try {
    const { data } = await createAdminClient().from("profiles").select("id").eq("referral_code", c).maybeSingle();
    return (data?.id as string) ?? null;
  } catch {
    return null;
  }
}

/** Pays the referrer once an order is delivered. Safe to call more than once. */
export async function rewardReferrer(orderId: string) {
  try {
    const db = createAdminClient();
    const { data: o } = await db.from("orders").select("referrer_id, user_id, subtotal, order_no").eq("id", orderId).maybeSingle();
    if (!o?.referrer_id || o.referrer_id === o.user_id) return;
    const amount = Math.min(CREDIT.rewardMax, Math.round(Number(o.subtotal) * (CREDIT.rewardPercent / 100)));
    if (amount <= 0) return;
    await db.from("credit_ledger").insert({ user_id: o.referrer_id as string, delta: amount, kind: "referral_reward", order_id: orderId, note: `Reward for order #${o.order_no}` });
  } catch {
    // A duplicate insert is blocked by the database, and nothing else here should break an order.
  }
}
