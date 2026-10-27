import { newBlock, type Block } from "@/lib/blocks";
import type { Product } from "@/lib/demo-products";

/** A ready layout to start from: headline, benefits, the order form with offers, and questions. */
export function landingStarter(products: Product[]): Block[] {
  const hero = newBlock("hero");
  if (hero.type === "hero") Object.assign(hero, { heading: "A headline that makes people want it", sub: "One clear sentence about the main benefit.", button: "Order now", link: "#order", variant: "split" });
  const features = newBlock("features");
  const order = newBlock("order");
  const p = products[0];
  if (order.type === "order" && p) {
    order.offers = [
      { id: "offer1", label: "Buy 1", badge: "", items: [{ productId: p.id, qty: 1 }], price: p.basePrice },
      { id: "offer2", label: "Buy 2 and save", badge: "Best value", items: [{ productId: p.id, qty: 2 }], price: Math.round(p.basePrice * 2 * 0.9) },
    ];
  }
  const faq = newBlock("faq");
  return [hero, features, order, faq];
}
