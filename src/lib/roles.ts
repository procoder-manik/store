/** Who may open which part of the admin panel. Safe to import anywhere: it holds no secrets. The database rules still apply underneath. */
export type StaffRole = "support" | "staff" | "manager" | "super_admin";

export const ROLES: { id: StaffRole; name: string; about: string }[] = [
  { id: "staff", name: "Order staff", about: "Sees orders, invoices and abandoned carts. Calls customers, confirms and updates orders. Does not see sales reports, products or settings." },
  { id: "support", name: "Support", about: "Reads orders and invoices to answer customers. Cannot change anything." },
  { id: "manager", name: "Manager", about: "Runs the store: products, orders, pages, banners, marketing and settings. Cannot manage users." },
  { id: "super_admin", name: "Super admin", about: "Everything, including creating users and changing their roles." },
];

export const roleName = (r: string) => ROLES.find((x) => x.id === r)?.name ?? r;
export const isStaffRole = (r: string): r is StaffRole => ROLES.some((x) => x.id === r);

const ORDER_PAGES = ["/admin/orders", "/admin/invoices", "/admin/abandoned"];
const SUPPORT_PAGES = ["/admin/orders", "/admin/invoices"];

const under = (path: string, base: string) => path === base || path.startsWith(`${base}/`);

export function canOpen(role: string, path: string) {
  if (role === "super_admin") return true;
  if (role === "manager") return !under(path, "/admin/users");
  if (role === "staff") return ORDER_PAGES.some((p) => under(path, p));
  if (role === "support") return SUPPORT_PAGES.some((p) => under(path, p));
  return false;
}

/** Where someone lands when they open the admin panel, or a page outside their role. */
export const adminHome = (role: string) => (role === "staff" || role === "support" ? "/admin/orders" : "/admin");
