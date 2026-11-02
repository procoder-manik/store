"use client";

import { Truck } from "lucide-react";
import { formatPrice } from "@/lib/config";
import { useZones } from "./ZonesProvider";

/**
 * Tells the shopper about free delivery, by itself, whenever an offer or an area's own amount is set.
 * With a subtotal it shows how much more is needed. With an area it speaks only for that area.
 */
export function FreeDeliveryNote({ subtotal, zoneId, className = "" }: { subtotal?: number; zoneId?: string; className?: string }) {
  const zones = useZones();
  const list = zoneId ? zones.filter((z) => z.id === zoneId) : zones;
  const at = Math.min(...list.map((z) => z.freeOver ?? Infinity));
  if (!Number.isFinite(at)) return null;
  const covered = list.filter((z) => z.freeOver === at);
  const where = !zoneId && covered.length < zones.length ? ` in ${covered.map((z) => z.name).join(", ")}` : "";
  const done = subtotal != null && subtotal >= at;
  return (
    <div className={`text-xs ${className}`}>
      <p className="flex items-center gap-2 font-medium">
        <Truck size={14} className="shrink-0 text-[var(--gold)]" />
        {subtotal == null ? `Free delivery on orders of ${formatPrice(at)} or more${where}.` : done ? `You get free delivery${where}.` : `Add ${formatPrice(at - subtotal)} more for free delivery${where}.`}
      </p>
      {subtotal != null && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10"><div style={{ width: `${Math.min(100, (subtotal / at) * 100)}%` }} className="h-full rounded-full bg-[var(--gold)] transition-[width] duration-500" /></div>}
    </div>
  );
}
