"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";

export async function deleteRedirect(fd: FormData) {
  const id = z.string().uuid().parse(fd.get("id"));
  const { supabase } = await requireAdmin("redirect.delete");
  await supabase.from("redirects").delete().eq("id", id);
  revalidatePath("/admin/permalinks");
}
