/** The store-wide free delivery offer. Safe to import anywhere: the same rule decides what shoppers see and what the server charges. */
export type FreeDeliveryRule = {
  enabled: boolean;
  /** Orders of this much or more, before any discount, deliver free. */
  amount: number;
  /** The delivery areas it covers. Empty means every area. */
  zones: string[];
  /** Last day of the offer, like 2026-12-31. Empty means no end. */
  endsAt: string;
};

export const DEFAULT_FREE_DELIVERY: FreeDeliveryRule = { enabled: false, amount: 0, zones: [], endsAt: "" };

export const ruleLive = (r: FreeDeliveryRule, now = Date.now()) => r.enabled && r.amount > 0 && (!r.endsAt || new Date(`${r.endsAt}T23:59:59+06:00`).getTime() >= now);

/** The amount that makes delivery free in one area: the offer, or the area's own amount, whichever is lower. */
export function freeOverFor(zoneId: string, own: number | null, rule: FreeDeliveryRule): number | null {
  const offer = ruleLive(rule) && (rule.zones.length === 0 || rule.zones.includes(zoneId)) ? rule.amount : null;
  if (offer == null) return own;
  return own == null ? offer : Math.min(own, offer);
}

export const withRule = <Z extends { id: string; freeOver: number | null }>(zones: Z[], rule: FreeDeliveryRule): Z[] => zones.map((z) => ({ ...z, freeOver: freeOverFor(z.id, z.freeOver, rule) }));

/** The delivery fee for an order. Used by every checkout on the server. */
export const deliveryFee = (zoneId: string, zone: { fee: number | string; free_over: number | string | null }, subtotal: number, rule: FreeDeliveryRule) => {
  const at = freeOverFor(zoneId, zone.free_over == null ? null : Number(zone.free_over), rule);
  return at != null && subtotal >= at ? 0 : Number(zone.fee);
};
