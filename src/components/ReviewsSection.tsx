import { getReviews } from "@/lib/reviews";
import { Stars } from "./Stars";
import { ReviewForm } from "./ReviewForm";

export async function ReviewsSection({ productId, slug }: { productId: string; slug: string }) {
  const { reviews, avg, count } = await getReviews(productId);
  return (
    <section className="mt-20" aria-labelledby="reviews">
      <h2 id="reviews" className="font-display text-2xl font-semibold">Customer reviews</h2>
      {count > 0 ? (
        <p className="mt-2 flex items-center gap-2 text-sm"><Stars value={avg} /> <span className="font-medium">{avg.toFixed(1)}</span> <span className="text-muted">from {count} {count === 1 ? "review" : "reviews"}</span></p>
      ) : (
        <p className="mt-2 text-sm text-muted">No reviews yet. Be the first to share what you think.</p>
      )}
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <ul className="grid content-start gap-5">
          {reviews.map((r) => (
            <li key={r.id} className="border-b border-line pb-5">
              <div className="flex items-center gap-2"><Stars value={r.rating} size={14} />{r.verified && <span className="rounded-pill bg-paper px-2 py-0.5 text-xs text-muted">Verified purchase</span>}</div>
              {r.title && <p className="mt-2 text-sm font-medium">{r.title}</p>}
              <p className="mt-1 whitespace-pre-line text-sm text-muted">{r.body}</p>
              <p className="mt-2 text-xs text-muted">{r.author}, {new Date(r.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}</p>
            </li>
          ))}
        </ul>
        <div><h3 className="mb-3 text-sm font-medium">Write a review</h3><ReviewForm productId={productId} slug={slug} /></div>
      </div>
    </section>
  );
}
