import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/config";
import { mfaRequired } from "@/lib/admin";
import { TestEmail } from "@/components/admin/TestEmail";

type Check = { name: string; ok: boolean; warn?: boolean; detail: string; fix?: string };

const TABLES: [string, string][] = [
  ["products", "0001"], ["orders", "0001"], ["leads", "0001"], ["site_settings", "0001"], ["audit_logs", "0001"],
  ["shipping_zones", "0003"], ["fraud_blacklist", "0003"], ["order_events", "0003"],
  ["addresses", "0005"], ["reviews", "0005"], ["product_relations", "0005"], ["landing_pages", "0005"], ["banners", "0005"],
  ["crm_notes", "0006"], ["email_templates", "0006"], ["email_campaigns", "0006"], ["email_optouts", "0006"], ["abandoned_carts", "0006"],
  ["pages", "0007"], ["bundles", "0007"], ["payments", "0009"], ["redirects", "0011"], ["email_log", "0013"],
];

export default async function Health() {
  const checks: Check[] = [];
  const env = (n: string) => !!process.env[n];
  const add = (c: Check) => checks.push(c);

  // ---- keys and settings
  add({ name: "Supabase address and public key", ok: env("NEXT_PUBLIC_SUPABASE_URL") && env("NEXT_PUBLIC_SUPABASE_ANON_KEY"), detail: env("NEXT_PUBLIC_SUPABASE_URL") ? "Found" : "Missing", fix: "Put NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the server." });
  add({ name: "Secret key (SUPABASE_SERVICE_ROLE_KEY)", ok: env("SUPABASE_SERVICE_ROLE_KEY"), detail: env("SUPABASE_SERVICE_ROLE_KEY") ? "Found" : "Missing", fix: "Supabase, Project Settings, API Keys: create a Secret key and paste it after SUPABASE_SERVICE_ROLE_KEY= in .env.local. Without it, orders, contact messages, tracking and emails cannot be saved." });
  add({ name: "Store address (NEXT_PUBLIC_SITE_URL)", ok: !SITE_URL.includes("localhost"), warn: SITE_URL.includes("localhost"), detail: SITE_URL, fix: "Fine while testing. Set your real domain before going live, it is used in emails, the sitemap and search results." });
  add({ name: "Email sending (Resend)", ok: env("RESEND_API_KEY") && env("EMAIL_FROM"), warn: true, detail: env("RESEND_API_KEY") ? "Found" : "Not set", fix: "Needed for thank-you emails, order emails and campaigns. Add RESEND_API_KEY and EMAIL_FROM." });
  add({ name: "AI (Gemini or Claude)", ok: env("GEMINI_API_KEY") || env("ANTHROPIC_API_KEY"), warn: true, detail: env("GEMINI_API_KEY") ? "Gemini key found" : env("ANTHROPIC_API_KEY") ? "Claude key found" : "Not set", fix: "Needed for the AI buttons, search listings and the chat assistant." });
  add({ name: "Online payment (SSLCommerz)", ok: env("SSLCOMMERZ_STORE_ID") && env("SSLCOMMERZ_STORE_PASSWORD"), warn: true, detail: env("SSLCOMMERZ_STORE_ID") ? "Found" : "Not set (cash on delivery only)", fix: "Optional. Add SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD." });

  // ---- who you are
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const { data: p } = user ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : { data: null };
    add({ name: "Your account", ok: !!p && ["manager", "super_admin"].includes(p.role as string), detail: `${user?.email ?? "not signed in"}, role: ${p?.role ?? "none"}`, fix: "Only manager and super_admin can save changes. Run the SQL that makes your email super_admin." });
    add({ name: "Two-step verification", ok: !mfaRequired() || aal?.currentLevel === "aal2", detail: mfaRequired() ? (aal?.currentLevel === "aal2" ? "Verified in this session" : "Not verified in this session") : "Switched off (REQUIRE_ADMIN_MFA=false)", fix: "While it is not verified, every save in the admin panel is refused. Sign out, sign in and enter your code, or set REQUIRE_ADMIN_MFA=false while testing." });
  } catch {
    add({ name: "Your account", ok: false, detail: "Could not read your session", fix: "Check the Supabase address and public key." });
  }

  // ---- database
  if (env("SUPABASE_SERVICE_ROLE_KEY") && env("NEXT_PUBLIC_SUPABASE_URL")) {
    const db = createAdminClient();
    const probe = await db.from("products").select("id", { count: "exact", head: true });
    add({ name: "Database connection with the secret key", ok: !probe.error, detail: probe.error ? probe.error.message : "Connected", fix: "The secret key is wrong or from another project. Create a new Secret key in Supabase and paste it again." });
    if (!probe.error) {
      const missing: string[] = [];
      for (const [t, m] of TABLES) {
        const r = await db.from(t).select("*", { count: "exact", head: true });
        if (r.error) missing.push(`${t} (file ${m})`);
      }
      add({ name: "Database tables", ok: missing.length === 0, detail: missing.length ? `Missing: ${missing.join(", ")}` : `All ${TABLES.length} tables found`, fix: "Run the missing numbered SQL files in the Supabase SQL Editor, in order." });
      const cols = await Promise.all([db.from("orders").select("courier, source").limit(1), db.from("categories").select("description").limit(1), db.from("pages").select("kind").limit(1)]);
      add({ name: "Newer columns", ok: !cols[0].error && !cols[1].error && !cols[2].error, detail: cols[0].error ? "orders.courier missing (file 0010)" : cols[1].error ? "categories.description missing (file 0011)" : cols[2].error ? "pages.kind missing (file 0012)" : "Found", fix: "Run 0010, 0011 and 0012." });
      const fn = await Promise.all([db.rpc("crm_customers"), db.rpc("sales_series", { p_from: new Date(Date.now() - 864e5).toISOString(), p_to: new Date().toISOString(), p_bucket: "day" })]);
      add({ name: "Report functions", ok: !fn[0].error && !fn[1].error, detail: fn[1].error ? "sales_series missing (file 0004)" : fn[0].error ? "crm_customers missing (file 0006)" : "Found", fix: "Run 0004 and 0006." });
      const bucket = await db.storage.getBucket("product-images");
      add({ name: "Photo storage", ok: !bucket.error, detail: bucket.error ? "Bucket product-images not found" : "Found", fix: "Run file 0002 (it creates the product-images bucket)." });
      const sets = await db.from("shipping_zones").select("id", { count: "exact", head: true }).eq("active", true);
      add({ name: "Delivery areas", ok: (sets.count ?? 0) > 0, detail: `${sets.count ?? 0} active`, fix: "Add at least one delivery area in Shipping, or customers cannot check out." });
    }
  }

  let log: { id: string; to_email: string; subject: string; status: string; error: string | null }[] = [];
  if (env("SUPABASE_SERVICE_ROLE_KEY")) { try { log = ((await createAdminClient().from("email_log").select("id, to_email, subject, status, error").order("created_at", { ascending: false }).limit(6)).data ?? []) as typeof log; } catch { /* none */ } }
  const bad = checks.filter((c) => !c.ok && !c.warn).length;
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Health check</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">Finds why something is not saving or sending. Red items must be fixed. Orange items are optional features that are not set up. Reload this page after each fix.</p>
      <p className={`mt-4 inline-flex rounded-pill px-4 py-1.5 text-sm font-medium ${bad ? "bg-red-500/15 text-red-700" : "bg-emerald-500/15 text-emerald-700"}`}>{bad ? `${bad} ${bad === 1 ? "problem needs" : "problems need"} fixing` : "Everything required is working"}</p>
      <ul className="mt-6 grid max-w-3xl gap-3">
        {checks.map((c) => (
          <li key={c.name} className="rounded-xl border border-line bg-surface p-4 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="font-medium">{c.name}</p><p className="mt-0.5 break-words text-muted">{c.detail}</p></div>
              <span className={`shrink-0 rounded-pill px-3 py-0.5 text-xs font-semibold ${c.ok ? "bg-emerald-500/15 text-emerald-700" : c.warn ? "bg-amber-500/15 text-amber-700" : "bg-red-500/15 text-red-700"}`}>{c.ok ? "OK" : c.warn ? "Optional" : "Fix"}</span>
            </div>
            {!c.ok && c.fix && <p className="mt-2 rounded-lg bg-paper p-3 text-xs">{c.fix}</p>}
          </li>
        ))}
      </ul>

      <section className="mt-8 max-w-3xl rounded-xl border border-line bg-surface p-5">
        <h2 className="font-display text-base font-semibold">Email test</h2>
        <p className="mt-1 text-sm text-muted">Sends a real email to your own address and shows the exact reason if it cannot be delivered. Use it when thank-you or order emails do not arrive.</p>
        <div className="mt-4"><TestEmail /></div>
        {log.length > 0 && (
          <ul className="mt-5 divide-y divide-line text-sm">
            {log.map((m) => <li key={m.id} className="py-2.5"><div className="flex justify-between gap-3"><span className="min-w-0 truncate">{m.subject}<span className="block truncate text-xs text-muted">to {m.to_email}</span></span><span className={`shrink-0 text-xs font-medium ${m.status === "sent" ? "text-emerald-700" : "text-red-600"}`}>{m.status === "sent" ? "Sent" : "Failed"}</span></div>{m.error && <p className="mt-1.5 rounded-lg bg-paper p-2.5 text-xs">{m.error}</p>}</li>)}
          </ul>
        )}
      </section>
    </>
  );
}
