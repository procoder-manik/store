import { statusLabel } from "@/lib/order-status";

const STEPS = [
  ["pending", "Order placed"],
  ["confirmed", "Confirmed"],
  ["processing", "Being packed"],
  ["shipped", "On the way"],
  ["out_for_delivery", "Out for delivery"],
  ["delivered", "Delivered"],
] as const;

export function OrderTimeline({ status, events }: { status: string; events: { status: string; created_at: string }[] }) {
  if (status === "cancelled" || status === "returned") {
    const note = events.find((e) => e.status === status) as { note?: string } | undefined;
    return (
      <div className="rounded-xl border border-line bg-paper p-4 text-sm">
        <p>This order was <span className="font-medium">{statusLabel(status).toLowerCase()}</span>.</p>
        {note?.note && <p className="mt-1 text-muted">{note.note}</p>}
      </div>
    );
  }
  const at = new Map(events.map((e) => [e.status, e.created_at]));
  const current = STEPS.findIndex(([s]) => s === status);
  return (
    <ol className="relative grid gap-5 pl-1">
      {STEPS.map(([s, label], i) => {
        const done = i <= current;
        const when = at.get(s);
        return (
          <li key={s} className="relative flex items-start gap-3">
            {i < STEPS.length - 1 && <span aria-hidden className={`absolute left-[9px] top-6 h-full w-0.5 ${i < current ? "bg-accent" : "bg-line"}`} />}
            <span className={`relative z-10 mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] ${done ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-transparent"}`}>&#10003;</span>
            <span className={`text-sm ${done ? "font-medium" : "text-muted"}`}>{label}{when && <span className="block text-xs font-normal text-muted">{new Date(when).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>}</span>
          </li>
        );
      })}
    </ol>
  );
}
