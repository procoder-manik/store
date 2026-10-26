"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "@/lib/cart";

export function RestoreCart({ items }: { items: CartItem[] }) {
  const router = useRouter();
  const setItems = useCart((s) => s.setItems);
  useEffect(() => {
    setItems(items);
    router.replace("/checkout");
  }, [items, setItems, router]);
  return <p className="px-5 py-16 text-center text-sm text-muted">Restoring your cart...</p>;
}
