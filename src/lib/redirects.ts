import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

/** The new address for a renamed page, or null. Only addresses we created ourselves are followed. */
export const findRedirect = cache(async (path: string): Promise<string | null> => {
  const sb = createPublicClient();
  if (!sb) return null;
  const { data, error } = await sb.from("redirects").select("to_path").eq("from_path", path).maybeSingle();
  if (error || !data) return null;
  const to = data.to_path as string;
  return to.startsWith("/") && !to.startsWith("//") && to !== path ? to : null;
});
