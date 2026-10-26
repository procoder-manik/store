import "server-only";
import { clientIp } from "@/lib/ratelimit";
import { createAdminClient } from "@/lib/supabase/admin";

/** Records who did what in the admin panel. A logging problem must never stop the work itself. */
export async function audit(user: { id: string; email?: string | null }, action: string, meta: Record<string, unknown> = {}) {
  try {
    const ip = await clientIp();
    await createAdminClient().from("audit_logs").insert({ actor: user.id, action, entity: action.split(".")[0], meta: { email: user.email ?? null, ip, ...meta } });
  } catch {
    // ignore
  }
}
