"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { normalizePhone } from "@/lib/utils";
import { CATALOG, type MethodId, type PaymentsSettings } from "@/lib/payments";

const method = z.object({
  enabled: z.boolean(),
  account: z.string().trim().max(400),
  accountType: z.enum(["", "personal", "agent", "merchant"]),
  instructions: z.string().trim().max(200),
});
const schema = z.object({ methods: z.record(z.string(), method) });

export async function savePayments(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  let ctx;
  try { ctx = await requireAdmin("payments.save"); } catch (e) { return { ok: false, error: (e as Error).message }; }

  const methods = {} as PaymentsSettings["methods"];
  for (const c of CATALOG) {
    const m = p.data.methods[c.id];
    if (!m) return { ok: false, error: `Missing settings for ${c.name}.` };
    let account = m.account;
    // A mobile wallet number is stored in one clean format. Bank details stay as typed.
    if (c.manual && c.group === "mobile" && account) {
      const n = normalizePhone(account);
      if (!n) return { ok: false, error: `${c.name}: enter a valid mobile number, like 01712345678.` };
      account = n;
    }
    // A gateway that is only listed (not connected yet) can never be switched on.
    const enabled = m.enabled && c.ready;
    if (enabled && c.manual && !account) return { ok: false, error: `Add the ${c.name} ${c.group === "bank" ? "bank details" : "number"} before turning it on.` };
    methods[c.id as MethodId] = { enabled, account, accountType: c.group === "mobile" ? m.accountType : "", instructions: m.instructions };
  }
  if (!Object.values(methods).some((m) => m.enabled)) return { ok: false, error: "Keep at least one payment method turned on, or customers cannot order." };

  const { error } = await ctx.supabase.from("site_settings").upsert({ key: "payments", value: { methods }, is_public: true });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
