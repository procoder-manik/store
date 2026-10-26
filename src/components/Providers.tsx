"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { useCart } from "@/lib/cart";

export function Providers({ children }: { children: React.ReactNode }) {
  // Load the saved cart after the first paint so the page and the browser agree on what to show.
  useEffect(() => { void useCart.persist.rehydrate(); }, []);
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
