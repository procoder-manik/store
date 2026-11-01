"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = { action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>; goTo: string; className?: string; children: React.ReactNode };

/** A form that shows a problem next to the Save button and keeps what was typed, instead of opening an error page. */
export function ActionForm({ action, goTo, className, children }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      aria-busy={pending}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError("");
        start(async () => {
          const r = await action(fd);
          if (!r.ok) return setError(r.error ?? "Could not save. Please try again.");
          router.push(goTo);
          router.refresh();
        });
      }}
      className={className}
    >
      {children}
      {error && <p role="alert" className="text-sm font-medium text-[var(--madder)] sm:col-span-2">{error}</p>}
    </form>
  );
}
