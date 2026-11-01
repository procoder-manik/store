"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * A password reset link can land on any page, depending on the allowed addresses set in Supabase.
 * Wherever it lands, this sends the person on to the form that sets the new password.
 */
export function RecoveryCatcher() {
  useEffect(() => {
    const { pathname, search, hash } = window.location;
    if (pathname === "/reset-password") return;
    if (!new URLSearchParams(search).has("code") && !hash.includes("access_token")) return;
    const { data: { subscription } } = createClient().auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") window.location.replace("/reset-password");
    });
    return () => subscription.unsubscribe();
  }, []);
  return null;
}
