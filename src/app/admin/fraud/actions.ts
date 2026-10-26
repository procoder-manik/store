"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { normalizePhone } from "@/lib/utils";

const schema = z.object({ kind: z.enum(["phone", "ip", "email"]), value: z.string().trim().min(3).max(120), reason: z.string().trim().max(200) });

export async function addBlock(formData: FormData) {
  const d = schema.parse({ kind: formData.get("kind"), value: formData.get("value"), reason: String(formData.get("reason") ?? "") });
  let value = d.value.toLowerCase();
  if (d.kind === "phone") {
    const p = normalizePhone(d.value);
    if (!p) throw new Error("Enter a valid mobile number, like 01712345678");
    value = p;
  }
  const { supabase } = await requireAdmin("fraud.block");
  const { error } = await supabase.from("fraud_blacklist").insert({ kind: d.kind, value, reason: d.reason || null });
  if (error && error.code !== "23505") throw new Error(error.message);
  revalidatePath("/admin/fraud");
}

export async function removeBlock(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const { supabase } = await requireAdmin("fraud.unblock");
  await supabase.from("fraud_blacklist").delete().eq("id", id);
  revalidatePath("/admin/fraud");
}
