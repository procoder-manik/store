"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/lib/track";

export function PurchaseEvent({ orderNo, total }: { orderNo: number; total: number }) {
  useEffect(() => {
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
