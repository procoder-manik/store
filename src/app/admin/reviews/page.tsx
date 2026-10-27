import { createClient } from "@/lib/supabase/server";
import { Stars } from "@/components/Stars";
import { approveReview, deleteReview } from "./actions";

type R = { id: string; author: string; rating: number; title: string | null; body: string; verified: boolean; status: string; created_at: string; products: { name: string } | { name: string }[] | null };

export default async function Reviews() {
  const supabase = await createClient();
  const { data } = await supabase.from("reviews").select("id, author, rating, title, body, verified, status, created_at, products(name)").order("status").order("created_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as unknown as R[];
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Reviews</h1>
      <p className="mt-1 text-sm text-muted">New reviews wait here until you approve them.</p>
      <ul className="mt-6 grid max-w-3xl gap-3">
        {rows.length === 0 && <li className="rounded-xl border border-line bg-surface p-5 text-sm text-muted">No reviews yet.</li>}
        {rows.map((r) => {
          const prod = Array.isArray(r.products) ? r.products[0] : r.products;
          return (
            <li key={r.id} className="rounded-xl border border-line bg-surface p-5 text-sm">
              <div className="flex flex-wrap items-center gap-2"><Stars value={r.rating} size={14} /><span className="font-medium">{prod?.name}</span><span className={`rounded-pill px-2 py-0.5 text-xs ${r.status === "pending" ? "bg-amber-100 text-amber-900" : "bg-paper text-muted"}`}>{r.status}</span>{r.verified && <span className="text-xs text-muted">Verified purchase</span>}</div>
              {r.title && <p className="mt-2 font-medium">{r.title}</p>}
              <p className="mt-1 whitespace-pre-line text-muted">{r.body}</p>
              <p className="mt-2 text-xs text-muted">{r.author}, {new Date(r.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}</p>
              <div className="mt-3 flex gap-4 text-xs">
                {r.status === "pending" && <form action={approveReview}><input type="hidden" name="id" value={r.id} /><button className="font-medium text-accent underline">Approve</button></form>}
                <form action={deleteReview}><input type="hidden" name="id" value={r.id} /><button className="text-red-600 underline">Delete</button></form>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
