type W = Window & { fbq?: (...a: unknown[]) => void; gtag?: (...a: unknown[]) => void; dataLayer?: unknown[] };

function send(fb: [string, string, object], ga: [string, object]) {
  if (typeof window === "undefined") return;
  const w = window as W;
  try {
    w.fbq?.("track", fb[1], fb[2]);
    if (w.gtag) w.gtag("event", ga[0], ga[1]);
    else w.dataLayer?.push({ event: ga[0], ...ga[1] });
  } catch {
    // Tracking must never break the store.
  }
}

export function trackAddToCart(i: { id: string; name: string; price: number; qty: number }) {
  const value = i.price * i.qty;
  send(["track", "AddToCart", { content_ids: [i.id], content_name: i.name, value, currency: "BDT" }],
    ["add_to_cart", { currency: "BDT", value, items: [{ item_id: i.id, item_name: i.name, price: i.price, quantity: i.qty }] }]);
}

export function trackPurchase(orderNo: number, total: number) {
  send(["track", "Purchase", { value: total, currency: "BDT" }],
    ["purchase", { transaction_id: String(orderNo), value: total, currency: "BDT" }]);
}
