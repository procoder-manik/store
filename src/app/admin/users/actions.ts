"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

const role = z.enum(["support", "staff", "manager", "super_admin"]);
const newUser = z.object({
  name: z.string().trim().min(2, "Enter the person's name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(120),
  password: z.string().min(10, "Use a password of at least 10 characters").max(72),
  role,
});

type Result = { ok: boolean; message: string };

async function findByEmail(email: string) {
  const db = createAdminClient();
  for (let page = 1; page <= 20; page++) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 200 });
    const found = data?.users.find((u) => u.email?.toLowerCase() === email);
    if (found) return found;
    if (!data || data.users.length < 200) return null;
  }
  return null;
}

/** Creates a sign-in for a team member. Someone who already has a customer account keeps their password and just gets the role. */
export async function createStaff(input: unknown): Promise<Result> {
  const p = newUser.safeParse(input);
  if (!p.success) return { ok: false, message: p.error.issues[0].message };
  try { await requireSuperAdmin("user.create"); } catch (e) { return { ok: false, message: (e as Error).message }; }
  const db = createAdminClient();
  const existing = await findByEmail(p.data.email);
  let id = existing?.id;
  if (!id) {
    const { data, error } = await db.auth.admin.createUser({ email: p.data.email, password: p.data.password, email_confirm: true, user_metadata: { full_name: p.data.name } });
    if (error) return { ok: false, message: error.message };
    id = data.user.id;
  }
  const { error } = await db.from("profiles").upsert({ id, full_name: p.data.name, role: p.data.role });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/users");
  return { ok: true, message: existing ? "This email already had an account, so it keeps its own password. The role is added." : "User created. Give them the email and password. They set up two-step verification at first sign-in." };
}

export async function setStaffRole(fd: FormData) {
  const d = z.object({ id: z.string().uuid(), role }).parse({ id: fd.get("id"), role: fd.get("role") });
  const { user } = await requireSuperAdmin("user.role");
  if (d.id === user.id) throw new Error("You cannot change your own role.");
  const { error } = await createAdminClient().from("profiles").update({ role: d.role }).eq("id", d.id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

/** Takes away admin access. The account stays as a normal customer, so past records are not lost. */
export async function removeStaff(fd: FormData) {
  const id = z.string().uuid().parse(fd.get("id"));
  const { user } = await requireSuperAdmin("user.remove");
  if (id === user.id) throw new Error("You cannot remove your own access.");
  const { error } = await createAdminClient().from("profiles").update({ role: "customer" }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

export async function setStaffPassword(input: unknown): Promise<Result> {
  const p = z.object({ id: z.string().uuid(), password: z.string().min(10, "Use a password of at least 10 characters").max(72) }).safeParse(input);
  if (!p.success) return { ok: false, message: p.error.issues[0].message };
  try { await requireSuperAdmin("user.password"); } catch (e) { return { ok: false, message: (e as Error).message }; }
  const { error } = await createAdminClient().auth.admin.updateUserById(p.data.id, { password: p.data.password });
  return error ? { ok: false, message: error.message } : { ok: true, message: "Password changed." };
}

/** For a team member who lost their phone. They set up two-step verification again at the next sign-in. */
export async function resetStaffMfa(fd: FormData) {
  const id = z.string().uuid().parse(fd.get("id"));
  await requireSuperAdmin("user.mfa_reset");
  const db = createAdminClient();
  const { data } = await db.auth.admin.mfa.listFactors({ userId: id });
  for (const f of data?.factors ?? []) await db.auth.admin.mfa.deleteFactor({ id: f.id, userId: id });
  revalidatePath("/admin/users");
}
