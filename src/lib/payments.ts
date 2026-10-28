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
export type PaymentsSettings = { methods: Record<MethodId, MethodCfg> };

const blank = (enabled = false): MethodCfg => ({ enabled, account: "", accountType: "", instructions: "" });
export const DEFAULT_PAYMENTS: PaymentsSettings = {
  methods: Object.fromEntries(CATALOG.map((c) => [c.id, blank(c.id === "cod")])) as Record<MethodId, MethodCfg>,
};

export function mergePayments(v: unknown): PaymentsSettings {
  const saved = ((v ?? {}) as { methods?: Partial<Record<MethodId, Partial<MethodCfg>>> }).methods ?? {};
  const methods = {} as Record<MethodId, MethodCfg>;
  for (const c of CATALOG) methods[c.id] = { ...DEFAULT_PAYMENTS.methods[c.id], ...(saved[c.id] ?? {}) };
  return { methods };
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
