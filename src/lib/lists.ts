"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type ListState = { ids: string[]; toggle: (id: string) => void; clear: () => void };

const make = (name: string, max: number) =>
  create<ListState>()(
    persist(
      (set) => ({
        ids: [],
        toggle: (id) => set((s) => (s.ids.includes(id) ? { ids: s.ids.filter((x) => x !== id) } : s.ids.length >= max ? s : { ids: [...s.ids, id] })),
        clear: () => set({ ids: [] }),
      }),
      { name },
    ),
  );

export const useWishlist = make("wishlist", 100);
export const useCompare = make("compare", 4);

/** Saved lists live in the browser, so server and first client render must match. */
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
