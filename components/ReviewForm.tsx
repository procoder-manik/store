"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { submitReview } from "@/app/actions/reviews";

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm";

export function ReviewForm({ productId, slug }: { productId: string; slug: string }) {
  const [user, setUser] = useState<boolean | null>(null);
  const [rating, setRating] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    try {
      createClient().auth.getUser().then(({ data }) => setUser(!!data.user)).catch(() => setUser(false));
    } catch {
      setUser(false); // no database connected yet
    }
  }, []);

  if (user === null) return null;
  if (!user) return <p className="text-sm text-muted"><Link href={`/login?next=/product/${slug}`} className="underline">Sign in</Link> to write a review.</p>;
  if (msg?.ok) return <p className="rounded-xl border border-line bg-paper p-4 text-sm">{msg.text}</p>;

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setMsg(null);
    start(async () => {
      const r = await submitReview({ productId, rating, title: String(f.get("title") ?? ""), body: String(f.get("body") ?? "") });
      setMsg({ ok: r.ok, text: r.message });
    });
  }

  return (
    <form onSubmit={submit} className="grid max-w-lg gap-3">
      <div className="flex gap-1" role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" role="radio" aria-checked={rating === i} aria-label={`${i} star${i > 1 ? "s" : ""}`} onClick={() => setRating(i)}><Star size={26} className="text-amber-500" fill={i <= rating ? "currentColor" : "none"} /></button>
        ))}
      </div>
      <input name="title" placeholder="Title (optional)" maxLength={80} className={input} />
      <textarea name="body" required minLength={10} maxLength={1000} rows={4} placeholder="What did you think of it?" className={input} />
      {msg && !msg.ok && <p role="alert" className="text-sm text-red-600">{msg.text}</p>}
      <button disabled={pending} className="w-fit rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-50">{pending ? "Sending..." : "Submit review"}</button>
    </form>
  );
}
