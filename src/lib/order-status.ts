export const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<string, string> = {
  pending: "New", confirmed: "Confirmed", processing: "Packing", shipped: "Shipped",
  out_for_delivery: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled", returned: "Returned",
};

export const STATUS_COLOR: Record<string, string> = {
  pending: "#e0a226", confirmed: "#3b82c4", processing: "#6366c9", shipped: "#8b5cc4",
  out_for_delivery: "#0ea5a5", delivered: "#2f9e62", cancelled: "#d14343", returned: "#8a8f98",
};

/** What can happen next from each status. The first one is the normal next step. */
export const NEXT_STEPS: Record<string, { to: OrderStatus; label: string }[]> = {
  pending: [{ to: "confirmed", label: "Confirm order" }, { to: "cancelled", label: "Cancel order" }],
  confirmed: [{ to: "processing", label: "Start packing" }, { to: "shipped", label: "Mark as shipped" }, { to: "cancelled", label: "Cancel order" }],
  processing: [{ to: "shipped", label: "Mark as shipped" }, { to: "cancelled", label: "Cancel order" }],
  shipped: [{ to: "out_for_delivery", label: "Out for delivery" }, { to: "delivered", label: "Mark as delivered" }, { to: "returned", label: "Mark as returned" }, { to: "cancelled", label: "Cancel order" }],
  out_for_delivery: [{ to: "delivered", label: "Mark as delivered" }, { to: "returned", label: "Mark as returned" }, { to: "cancelled", label: "Cancel order" }],
  delivered: [{ to: "returned", label: "Mark as returned" }],
  cancelled: [],
  returned: [],
};

export const statusLabel = (s: string) => STATUS_LABEL[s] ?? s;
export const statusColor = (s: string) => STATUS_COLOR[s] ?? "#8a8f98";
