"use client";

import { createContext, useContext } from "react";
import type { CardStyleId } from "@/lib/themes";

const Ctx = createContext<CardStyleId>("soft");

/** Tells every product card below which style the store has chosen. */
export function CardStyle({ value, children }: { value: CardStyleId; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCardStyle = () => useContext(Ctx);
