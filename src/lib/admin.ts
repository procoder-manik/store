import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";

export { slugify, imageUrl } from "@/lib/utils";

/** Two-step verification is required for the admin panel unless you set REQUIRE_ADMIN_MFA=false (local testing only). */
export const mfaRequired = () => process.env.REQUIRE_ADMIN_MFA !== "false";

async function assertMfa(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!mfaRequired()) return;
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (data?.currentLevel !== "aal2") throw new Error("Two-step verification is required. Open the admin panel and enter your code.");
}

async function guard(roles: string[], action?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !roles.includes(profile.role)) throw new Error("Forbidden");
  await assertMfa(supabase);
  if (action) await audit(user, action);
  return { supabase, user };
}

/** Server-side gate for every admin write. RLS enforces the same rule in the database. */
export const requireAdmin = (action?: string) => guard(["manager", "super_admin"], action);

/** Order handling is allowed for staff and above. */
export const requireStaff = (action?: string) => guard(["staff", "manager", "super_admin"], action);
