import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

export type Review = { id: string; author: string; rating: number; title: string; body: string; verified: boolean; created_at: string };

export const getReviews = cache(async (productId: string): Promise<{ reviews: Review[]; avg: number; count: number }> => {
  const sb = createPublicClient();
  if (!sb) return { reviews: [], avg: 0, count: 0 };
  const { data, error } = await sb.from("reviews").select("id, author, rating, title, body, verified, created_at").eq("product_id", productId).eq("status", "approved").order("created_at", { ascending: false }).limit(30);
  if (error) return { reviews: [], avg: 0, count: 0 };
  const reviews = (data ?? []) as Review[];
  const count = reviews.length;
  return { reviews, count, avg: count ? reviews.reduce((n, r) => n + r.rating, 0) / count : 0 };
});
