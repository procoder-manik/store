"use client";

import { createContext, useContext } from "react";
import type { PublicMethod } from "@/lib/payments";

const Ctx = createContext<PublicMethod[]>([]);

/** The payment methods open right now, loaded once in the layout so the quick "Buy now" popup can offer them too. */
export function PaymentsProvider({ methods, children }: { methods: PublicMethod[]; children: React.ReactNode }) {
  return <Ctx.Provider value={methods}>{children}</Ctx.Provider>;
}

export const usePaymentMethods = () => useContext(Ctx);
