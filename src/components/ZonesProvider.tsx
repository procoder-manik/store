"use client";

import { createContext, useContext } from "react";
import type { Zone } from "./QuickBuy";

const Ctx = createContext<Zone[]>([]);

/** Delivery areas, loaded once in the layout so any product card can open a quick checkout. */
export function ZonesProvider({ zones, children }: { zones: Zone[]; children: React.ReactNode }) {
  return <Ctx.Provider value={zones}>{children}</Ctx.Provider>;
}

export const useZones = () => useContext(Ctx);
