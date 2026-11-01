/** Shown for a moment while the shop loads, so the layout never jumps. */
export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-10 md:px-8" aria-busy="true" aria-label="Loading products">
      <div className="skeleton h-12 w-40" />
      <div className="skeleton mt-6 h-10 w-full max-w-xl" />
      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => <div key={i}><div className="skeleton aspect-[4/5] w-full" /><div className="skeleton mt-3 h-4 w-3/4" /><div className="skeleton mt-2 h-4 w-1/3" /></div>)}
      </div>
    </main>
  );
}
