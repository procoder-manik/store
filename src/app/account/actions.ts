"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/utils";

function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const r = schema.safeParse(data);
  if (!r.success) throw new Error(r.error.issues[0].message);
  return r.data;
}

async function me() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in again.");
  return { supabase, user };
}

const phone = z.string().trim().transform((v, ctx) => {
  const p = normalizePhone(v);
  if (!p) ctx.addIssue({ code: "custom", message: "Enter a valid mobile number, like 01712345678" });
  return p ?? "";
});

export async function saveProfile(fd: FormData) {
  const d = parse(z.object({ name: z.string().trim().min(2, "Enter your name").max(80), phone: z.union([z.literal(""), phone]) }), { name: fd.get("name"), phone: String(fd.get("phone") ?? "") });
  const { supabase, user } = await me();
  const { error } = await supabase.from("profiles").update({ full_name: d.name, phone: d.phone || null }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/account");
}

export async function addAddress(fd: FormData) {
  const d = parse(z.object({
    label: z.string().trim().max(30),
    name: z.string().trim().min(2, "Enter the receiver name").max(80),
    phone,
    district: z.string().trim().min(2, "Enter the district").max(60),
    address: z.string().trim().min(6, "Enter the full address").max(300),
  }), { label: String(fd.get("label") ?? ""), name: fd.get("name"), phone: fd.get("phone"), district: fd.get("district"), address: fd.get("address") });
  const { supabase, user } = await me();
  const { count } = await supabase.from("addresses").select("id", { count: "exact", head: true });
  if ((count ?? 0) >= 10) throw new Error("You can save up to 10 addresses.");
  const first = (count ?? 0) === 0;
  const { error } = await supabase.from("addresses").insert({ ...d, label: d.label || null, user_id: user.id, is_default: first });
  if (error) throw new Error(error.message);
  revalidatePath("/account");
}

export async function deleteAddress(fd: FormData) {
  const id = z.string().uuid().parse(fd.get("id"));
  const { supabase } = await me();
  await supabase.from("addresses").delete().eq("id", id);
  revalidatePath("/account");
}

export async function setDefaultAddress(fd: FormData) {
  const id = z.string().uuid().parse(fd.get("id"));
  const { supabase, user } = await me();
  await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  await supabase.from("addresses").update({ is_default: true }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/account");
}
