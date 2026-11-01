/** Shown for a moment while a product page loads. */
export default function Loading() {
  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-5 py-8 md:grid-cols-2 md:gap-14 md:py-12" aria-busy="true" aria-label="Loading product">
      <div className="skeleton aspect-[4/5] w-full" />
      <div><div className="skeleton h-12 w-4/5" /><div className="skeleton mt-5 h-9 w-1/3" /><div className="skeleton mt-8 h-24 w-full" /><div className="skeleton mt-6 h-12 w-full" /><div className="skeleton mt-3 h-12 w-full" /></div>
    </main>
  );
}
