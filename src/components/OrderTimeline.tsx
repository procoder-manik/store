const STEPS = [
  ["pending", "Order placed"],
  ["confirmed", "Confirmed"],
  ["processing", "Being packed"],
  ["shipped", "On the way"],
  ["delivered", "Delivered"],
] as const;

export function OrderTimeline({ status, events }: { status: string; events: { status: string; created_at: string }[] }) {
  if (status === "cancelled" || status === "returned") {
    return <p className="rounded-xl border border-line bg-paper p-4 text-sm">This order was <span className="font-medium">{status}</span>.</p>;
  }
  const at = new Map(events.map((e) => [e.status, e.created_at]));
  const current = STEPS.findIndex(([s]) => s === status);
  return (
    <ol className="grid gap-4">
      {STEPS.map(([s, label], i) => {
        const done = i <= current;
        const when = at.get(s);
        return (
          <li key={s} className="flex items-start gap-3">
            <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] ${done ? "border-accent bg-accent text-accent-ink" : "border-line text-transparent"}`}>&#10003;</span>
            <span className={`text-sm ${done ? "font-medium" : "text-muted"}`}>{label}{when && <span className="block text-xs font-normal text-muted">{new Date(when).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>}</span>
          </li>
        );
      })}
    </ol>
  );
}
