"use client";

import { usePathname } from "next/navigation";

/** Hides the shop header and footer inside the admin panel, which has its own layout. */
export function StoreOnly({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (/^\/(admin|mfa)(\/|$)/.test(path)) return null;
  return <>{children}</>;
}
