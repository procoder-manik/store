"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp, rateLimit } from "@/lib/ratelimit";

const schema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1, "Choose a star rating").max(5),
  title: z.string().trim().max(80),
  body: z.string().trim().min(10, "Write at least 10 characters").max(1000),
});

export async function submitReview(input: unknown): Promise<{ ok: boolean; message: string }> {
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, message: p.error.issues[0].message };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in to write a review." };
  if (!(await rateLimit(`review:${user.id}`, 5, 3600))) return { ok: false, message: "You have sent several reviews already. Please try again later." };
  try {
    const db = createAdminClient();
    const { data: profile } = await db.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    const parts = String(profile?.full_name ?? "Customer").trim().split(/\s+/);
    const author = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
    const { data: bought } = await db.from("orders").select("id, order_items!inner(product_id)").eq("user_id", user.id).eq("status", "delivered").eq("order_items.product_id", p.data.productId).limit(1);
    const { error } = await db.from("reviews").insert({ product_id: p.data.productId, user_id: user.id, author, rating: p.data.rating, title: p.data.title || null, body: p.data.body, verified: (bought?.length ?? 0) > 0, status: "pending" });
    if (error) return { ok: false, message: error.code === "23505" ? "You have already reviewed this product." : "Could not save your review. Please try again." };
    return { ok: true, message: "Thank you. Your review will appear after we approve it." };
  } catch {
    return { ok: false, message: "Reviews are not available right now." };
  }
}
