"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/lib/track";

export function PurchaseEvent({ orderNo, total }: { orderNo: number; total: number }) {
  useEffect(() => {
    // A customer who has ordered no longer counts as a new visitor, so the welcome popup stays away.
    try { localStorage.setItem("promo-ordered", "1"); } catch { /* storage blocked */ }
    const key = `purchase-${orderNo}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage can be blocked. Fire once anyway.
    }
    trackPurchase(orderNo, total);
  }, [orderNo, total]);
  return null;
}
