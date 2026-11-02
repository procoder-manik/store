/**
 * Payment methods the store can offer. This file is safe to import from the browser: it holds no secrets.
 * Gateway keys (SSLCommerz store id and password) stay in server environment variables, never in these settings.
 */
export type MethodId = "cod" | "bkash" | "nagad" | "rocket" | "upay" | "bank" | "sslcommerz" | "aamarpay" | "shurjopay" | "paypal" | "payoneer";
export type MethodGroup = "cash" | "mobile" | "bank" | "gateway";

export type CatalogItem = {
  id: MethodId;
  name: string;
  group: MethodGroup;
  /** The customer sends money themselves and gives us the transaction ID. */
  manual: boolean;
  /** Does the store really take orders with this one today? Gateways marked false are listed so you can see what is coming. */
  ready: boolean;
  blurb: string;
};

export const CATALOG: CatalogItem[] = [
  { id: "cod", name: "Cash on delivery", group: "cash", manual: false, ready: true, blurb: "The customer pays in cash when the parcel arrives." },
  { id: "bkash", name: "bKash", group: "mobile", manual: true, ready: true, blurb: "Customer sends money to your bKash number, then enters the transaction ID." },
  { id: "nagad", name: "Nagad", group: "mobile", manual: true, ready: true, blurb: "Customer sends money to your Nagad number, then enters the transaction ID." },
  { id: "rocket", name: "Rocket", group: "mobile", manual: true, ready: true, blurb: "Customer sends money to your Rocket number, then enters the transaction ID." },
  { id: "upay", name: "Upay", group: "mobile", manual: true, ready: true, blurb: "Customer sends money to your Upay number, then enters the transaction ID." },
  { id: "bank", name: "Bank transfer", group: "bank", manual: true, ready: true, blurb: "Customer transfers to your bank account, then enters the reference or transaction ID." },
  { id: "sslcommerz", name: "SSLCommerz", group: "gateway", manual: false, ready: true, blurb: "Cards, bKash, Nagad, Rocket and banks on one secure page. Needs your store ID and password in the server settings." },
  { id: "aamarpay", name: "aamarPay", group: "gateway", manual: false, ready: false, blurb: "Bangladeshi gateway. Not connected yet." },
  { id: "shurjopay", name: "ShurjoPay", group: "gateway", manual: false, ready: false, blurb: "Bangladeshi gateway. Not connected yet." },
  { id: "paypal", name: "PayPal", group: "gateway", manual: false, ready: false, blurb: "For customers abroad. Not connected yet." },
  { id: "payoneer", name: "Payoneer", group: "gateway", manual: false, ready: false, blurb: "For customers abroad. Not connected yet." },
];

/** The colours each mobile wallet uses for its own brand, so customers know them at a glance. */
const WALLET_COLORS: Record<string, { bg: string; ink: string }> = {
  bkash: { bg: "#e2136e", ink: "#ffffff" },
  nagad: { bg: "#ec1c24", ink: "#ffffff" },
  rocket: { bg: "#8c3494", ink: "#ffffff" },
  upay: { bg: "#ffd200", ink: "#10255e" },
};
export const walletColor = (idOrName: string) => WALLET_COLORS[idOrName.toLowerCase()];

export const METHOD_IDS = CATALOG.map((c) => c.id) as MethodId[];
export const isMethodId = (v: string): v is MethodId => (METHOD_IDS as string[]).includes(v);
export const catalogItem = (id: string) => CATALOG.find((c) => c.id === id);
export const paymentLabel = (id: string | null | undefined) => catalogItem(id ?? "")?.name ?? (id ? id : "Cash on delivery");

export type AccountType = "" | "personal" | "agent" | "merchant";
export type MethodCfg = {
  enabled: boolean;
  /** The wallet number, or the bank details (several lines) for bank transfer. */
  account: string;
  accountType: AccountType;
  /** Extra words shown to the customer, like "Use Send Money, not Payment". */
  instructions: string;
};
/** Cash on delivery with money paid first. Set in Admin, Payment methods. */
export type AdvanceCfg = {
  /** The customer pays the delivery charge first, and the rest to the rider. */
  deliveryFirst: boolean;
  /** The customer may tick a box to also pay a percentage of the products first. */
  partialEnabled: boolean;
  percent: number;
  /** Orders with a pre-order item must pay the percentage first. */
  preorderPartial: boolean;
  /** Orders with any of these products must pay the percentage first. */
  requiredProducts: string[];
};
export const DEFAULT_ADVANCE: AdvanceCfg = { deliveryFirst: true, partialEnabled: true, percent: 50, preorderPartial: true, requiredProducts: [] };

export type AdvancePlan = "none" | "delivery" | "partial";

/** True when this order cannot skip the percentage: a pre-order, or a product the owner has marked. */
export function mustPayPartial(c: AdvanceCfg, o: { hasPreorder: boolean; productIds: string[] }) {
  return (o.hasPreorder && c.preorderPartial) || o.productIds.some((id) => c.requiredProducts.includes(id));
}

/** The choices under cash on delivery. The first is the default; the partial choice is opt-in, unless the order must pay it. Without a way to pay first, no advance can be asked for. */
export function advancePlans(c: AdvanceCfg, mustPartial: boolean, canPayFirst: boolean): AdvancePlan[] {
  if (!canPayFirst) return ["none"];
  if (mustPartial) return ["partial"];
  const base: AdvancePlan = c.deliveryFirst ? "delivery" : "none";
  return c.partialEnabled ? [base, "partial"] : [base];
}

/** How much is paid first. `total` already includes delivery and any discount. */
export function advanceAmount(plan: AdvancePlan, c: AdvanceCfg, o: { total: number; shipping: number }) {
  if (plan === "none") return 0;
  const shipping = Math.min(o.shipping, o.total);
  if (plan === "delivery") return shipping;
  const goods = Math.max(0, o.total - shipping);
  return Math.min(o.total, Math.round((goods * c.percent) / 100) + shipping);
}

/** What the rider still has to collect, for invoices, labels and the courier booking. */
export function amountDue(o: { total: number | string; payment_status: string; advance_amount?: number | string | null; advance_status?: string | null }) {
  if (o.payment_status === "paid") return 0;
  const paid = o.advance_status === "received" ? Number(o.advance_amount ?? 0) : 0;
  return Math.max(0, Number(o.total) - paid);
}

export type PaymentsSettings = { methods: Record<MethodId, MethodCfg>; advance: AdvanceCfg };

const blank = (enabled = false): MethodCfg => ({ enabled, account: "", accountType: "", instructions: "" });
export const DEFAULT_PAYMENTS: PaymentsSettings = {
  methods: Object.fromEntries(CATALOG.map((c) => [c.id, blank(c.id === "cod")])) as Record<MethodId, MethodCfg>,
  advance: DEFAULT_ADVANCE,
};

export function mergePayments(v: unknown): PaymentsSettings {
  const raw = (v ?? {}) as { methods?: Partial<Record<MethodId, Partial<MethodCfg>>>; advance?: Partial<AdvanceCfg> };
  const saved = raw.methods ?? {};
  const methods = {} as Record<MethodId, MethodCfg>;
  for (const c of CATALOG) methods[c.id] = { ...DEFAULT_PAYMENTS.methods[c.id], ...(saved[c.id] ?? {}) };
  return { methods, advance: { ...DEFAULT_ADVANCE, ...(raw.advance ?? {}) } };
}

export type PublicMethod = { id: MethodId; name: string; manual: boolean; account: string; accountType: AccountType; instructions: string };

/**
 * The methods a customer can pick right now. A manual method needs a number or account to show,
 * and SSLCommerz also needs its keys on the server, so a half-set-up method never appears at checkout.
 */
export function availableMethods(p: PaymentsSettings, opts: { sslReady: boolean }): PublicMethod[] {
  return CATALOG.filter((c) => {
    const cfg = p.methods[c.id];
    if (!cfg.enabled || !c.ready) return false;
    if (c.manual && !cfg.account.trim()) return false;
    if (c.id === "sslcommerz" && !opts.sslReady) return false;
    return true;
  }).map((c) => ({ id: c.id, name: c.name, manual: c.manual, account: p.methods[c.id].account, accountType: p.methods[c.id].accountType, instructions: p.methods[c.id].instructions }));
}

export const ACCOUNT_TYPE_LABEL: Record<Exclude<AccountType, "">, string> = { personal: "Personal", agent: "Agent", merchant: "Merchant" };
