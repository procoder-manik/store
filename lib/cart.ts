import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  key: string;
  id: string;
  variantId?: string;
  name: string;
  color: string;
  size: string;
  price: number;
  qty: number;
};

type CartState = {
  items: CartItem[];
  open: boolean;
  add: (i: Omit<CartItem, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  setOpen: (v: boolean) => void;
  clear: () => void;
  setItems: (items: CartItem[]) => void;
};

export const useCart = create<CartState>()(persist((set) => ({
  items: [],
  open: false,
  add: (i, qty = 1) =>
    set((s) => {
      const key = `${i.variantId ?? i.id}|${i.color}|${i.size}`;
      const found = s.items.find((x) => x.key === key);
      if (found) return { items: s.items.map((x) => (x.key === key ? { ...x, qty: Math.min(10, x.qty + qty) } : x)) };
      return { items: [...s.items, { ...i, key, qty }] };
    }),
  setQty: (key, qty) =>
    set((s) => ({ items: qty <= 0 ? s.items.filter((x) => x.key !== key) : s.items.map((x) => (x.key === key ? { ...x, qty } : x)) })),
  remove: (key) => set((s) => ({ items: s.items.filter((x) => x.key !== key) })),
  setOpen: (open) => set({ open }),
  clear: () => set({ items: [] }),
  setItems: (items) => set({ items }),
}), { name: "cart", partialize: (s) => ({ items: s.items }), skipHydration: true }));
