"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireStaff } from "@/lib/admin";

export async function setLeadStatus(fd: FormData) {
  const d = z.object({ id: z.string().uuid(), status: z.enum(["new", "contacted", "won", "lost"]) }).parse({ id: fd.get("id"), status: fd.get("status") });
  const { supabase } = await requireAdmin("lead.status");
  await supabase.from("leads").update({ status: d.status }).eq("id", d.id);
  revalidatePath("/admin/crm");
}

export async function deleteLead(fd: FormData) {
  const id = z.string().uuid().parse(fd.get("id"));
  const { supabase } = await requireAdmin("lead.delete");
  await supabase.from("leads").delete().eq("id", id);
  revalidatePath("/admin/crm");
}

export async function addNote(fd: FormData) {
  const d = z.object({ phone: z.string().regex(/^01\d{9}$/), note: z.string().trim().min(1, "Write a note").max(1000) }).parse({ phone: fd.get("phone"), note: fd.get("note") });
  const { supabase, user } = await requireStaff("crm.note");
  const { error } = await supabase.from("crm_notes").insert({ phone: d.phone, note: d.note, author: user.id });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/crm/customers/${d.phone}`);
}
