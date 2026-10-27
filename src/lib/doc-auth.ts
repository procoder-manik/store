import "server-only";
import { mfaRequired } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

/** For printable documents opened by staff: signed in, a staff role, and two-step verification when required. */
export async function staffOrNull() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401, supabase };
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!p || !["staff", "manager", "super_admin"].includes(p.role)) return { error: "Forbidden", status: 403, supabase };
  if (mfaRequired()) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") return { error: "Two-step verification required", status: 403, supabase };
  }
  return { error: null, status: 200, supabase };
}

export const DOC_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src https: data:",
};
