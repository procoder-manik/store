"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";

export async function approveReview(fd: FormData) {
  const id = z.string().uuid().parse(fd.get("id"));
  const { supabase } = await requireAdmin("review.approve");
  await supabase.from("reviews").update({ status: "approved" }).eq("id", id);
  revalidatePath("/admin/reviews");
  revalidatePath("/product/[slug]", "page");
}

export async function deleteReview(fd: FormData) {
  const id = z.string().uuid().parse(fd.get("id"));
  const { supabase } = await requireAdmin("review.delete");
  await supabase.from("reviews").delete().eq("id", id);
  revalidatePath("/admin/reviews");
  revalidatePath("/product/[slug]", "page");
}
