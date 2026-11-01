"use client";

import { createContext, useContext } from "react";
import { DEFAULT_ADVANCE, type AdvanceCfg, type PublicMethod } from "@/lib/payments";

const Ctx = createContext<PublicMethod[]>([]);
const AdvanceCtx = createContext<AdvanceCfg>(DEFAULT_ADVANCE);

/** The payment methods open right now, loaded once in the layout so the quick "Buy now" popup can offer them too. */
export function PaymentsProvider({ methods, advance, children }: { methods: PublicMethod[]; advance: AdvanceCfg; children: React.ReactNode }) {
  return <Ctx.Provider value={methods}><AdvanceCtx.Provider value={advance}>{children}</AdvanceCtx.Provider></Ctx.Provider>;
}

export const usePaymentMethods = () => useContext(Ctx);
export const useAdvance = () => useContext(AdvanceCtx);
