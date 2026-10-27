import { createClient } from "@/lib/supabase/server";
import { mergeSettings } from "@/lib/settings";
import { PALETTES } from "@/lib/palettes";
import { THEMES } from "@/lib/themes";
import { saveAnnouncement, saveBump, saveAppearance, saveChat, saveContact, savePopup, saveProof, saveTracking } from "./actions";

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";
const card = "rounded-xl border border-line bg-surface p-5";
const label = "mb-1 block text-xs font-medium text-muted";
const save = "rounded-pill bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink";

export default async function Settings() {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("key, value");
  const s = mergeSettings((data ?? []) as { key: string; value: unknown }[]);
  const { data: vs } = await supabase.from("product_variants").select("id, sku, color_name, size, products(name, status)").gt("stock", 0).limit(300);
  const variants = ((vs ?? []) as unknown as { id: string; sku: string; color_name: string | null; size: string | null; products: { name: string; status: string } | { name: string; status: string }[] | null }[])
    .map((v) => ({ id: v.id, prod: Array.isArray(v.products) ? v.products[0] : v.products, label: [v.color_name, v.size].filter(Boolean).join(", ") || v.sku }))
    .filter((v) => v.prod?.status === "active");

  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Settings</h1>
      <div className="mt-6 grid max-w-3xl gap-5">
        <form action={saveAppearance} className={`${card} grid gap-5`}>
          <div><h2 className="font-display text-base font-semibold">Theme</h2><p className="mt-1 text-xs text-muted">A theme changes everything at once: colors, backgrounds, text, heading and body fonts, and how rounded buttons and cards are. Dark mode has its own matching colors.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {THEMES.map((t) => (
              <label key={t.id} className="group relative cursor-pointer overflow-hidden rounded-xl border border-line has-[:checked]:border-ink has-[:checked]:ring-2 has-[:checked]:ring-ink/20">
                <input type="radio" name="theme" value={t.id} defaultChecked={s.appearance.theme === t.id} className="sr-only" />
                <span className="flex items-stretch">
                  <span style={{ background: t.light.paper, color: t.light.ink }} className="flex-1 p-4">
                    <span style={{ fontFamily: `var(${t.display}), system-ui` }} className="block text-lg font-semibold">{t.name}</span>
                    <span style={{ fontFamily: `var(${t.body}), system-ui`, opacity: 0.7 }} className="mt-1 block text-xs">{t.about}</span>
                    <span className="mt-3 flex items-center gap-1.5"><span style={{ background: t.light.accent }} className="h-5 w-12 rounded" /><span style={{ background: t.light.surface, borderColor: t.light.ink + "22" }} className="h-5 w-5 rounded border" /></span>
                  </span>
                  <span style={{ background: t.dark.paper, color: t.dark.ink }} className="grid w-16 content-center justify-items-center gap-2 p-2">
                    <span style={{ background: t.dark.accent }} className="h-5 w-10 rounded" /><span className="text-[10px] opacity-70">Dark</span>
                  </span>
                </span>
              </label>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Accent color (optional, overrides the theme color)</label>
              <select name="accent" defaultValue={s.appearance.accent} className={input}>
                <option value="">Use the theme color</option>
                {PALETTES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Light or dark by default</label>
              <select name="mode" defaultValue={s.appearance.mode} className={input}>
                <option value="light">Light</option><option value="dark">Dark</option><option value="system">Follow the visitor&apos;s device</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="visitorPicker" defaultChecked={s.appearance.visitorPicker} /> Let visitors switch the theme from the header</label>
          <button className={`${save} w-fit`}>Save theme</button>
        </form>

        <form action={saveAnnouncement} className={`${card} grid gap-4`}>
          <h2 className="font-display text-base font-semibold">Announcement bar</h2>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={s.announcement.enabled} /> Show the bar at the top of every page</label>
          <div><label className={label}>Message</label><input name="text" maxLength={160} defaultValue={s.announcement.text} className={input} /></div>
          <div><label className={label}>Link (optional)</label><input name="link" maxLength={200} defaultValue={s.announcement.link} placeholder="/shop" className={input} /></div>
          <button className={`${save} w-fit`}>Save announcement</button>
        </form>

        <form action={saveTracking} className={`${card} grid gap-4`}>
          <h2 className="font-display text-base font-semibold">Tracking and analytics</h2>
          <p className="text-xs text-muted">Leave a field empty to turn it off. If you add a Tag Manager ID, GA4 is loaded through it, so do not add GA4 again inside the container. Add to cart and purchase events are sent automatically.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={label}>Facebook Pixel ID</label><input name="fbPixel" defaultValue={s.tracking.fbPixel} placeholder="1234567890" className={input} /></div>
            <div><label className={label}>Google Analytics 4 ID</label><input name="ga4" defaultValue={s.tracking.ga4} placeholder="G-XXXXXXXXXX" className={input} /></div>
            <div><label className={label}>Google Tag Manager ID</label><input name="gtm" defaultValue={s.tracking.gtm} placeholder="GTM-XXXXXXX" className={input} /></div>
            <div><label className={label}>Search Console verification code</label><input name="gscToken" defaultValue={s.tracking.gscToken} placeholder="content value of the meta tag" className={input} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="consent" defaultChecked={s.tracking.consent} /> Ask visitors before tracking (shows a cookie banner, tracking starts only after Accept)</label>
          <button className={`${save} w-fit`}>Save tracking</button>
        </form>

        <form action={savePopup} className={`${card} grid gap-4`}>
          <h2 className="font-display text-base font-semibold">Promo popup</h2>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={s.popup.enabled} /> Show the popup to visitors (once per visit)</label>
          <div><label className={label}>Title</label><input name="title" required maxLength={80} defaultValue={s.popup.title} className={input} /></div>
          <div><label className={label}>Text</label><input name="text" maxLength={240} defaultValue={s.popup.text} className={input} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={label}>Coupon code (create it under Coupons first)</label><input name="code" maxLength={30} defaultValue={s.popup.code} className={input} /></div>
            <div><label className={label}>Button text</label><input name="button" maxLength={30} defaultValue={s.popup.button} className={input} /></div>
            <div><label className={label}>Show when</label><select name="trigger" defaultValue={s.popup.trigger} className={input}><option value="delay">After a delay</option><option value="exit">The visitor is about to leave</option></select></div>
            <div><label className={label}>Delay in seconds</label><input name="delay" type="number" min={3} max={120} defaultValue={s.popup.delay} className={input} /></div>
          </div>
          <button className={`${save} w-fit`}>Save popup</button>
        </form>

        <form action={saveContact} className={`${card} grid gap-4`}>
          <h2 className="font-display text-base font-semibold">Contact numbers</h2>
          <p className="text-xs text-muted">Shown on your Contact page and in the footer. A WhatsApp number adds an "Order on WhatsApp" button to every product page.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={label}>Phone number</label><input name="phone" inputMode="tel" defaultValue={s.contact.phone} placeholder="01712345678" className={input} /></div>
            <div><label className={label}>WhatsApp number</label><input name="whatsapp" inputMode="tel" defaultValue={s.contact.whatsapp.replace(/^88/, "")} placeholder="01712345678" className={input} /></div>
            <div><label className={label}>Support email</label><input name="email" type="email" defaultValue={s.contact.email} placeholder="hello@yourstore.com" className={input} /></div>
            <div><label className={label}>Opening hours</label><input name="hours" maxLength={120} defaultValue={s.contact.hours} placeholder="Every day, 10am to 8pm" className={input} /></div>
          </div>
          <div><label className={label}>Address (optional)</label><input name="address" maxLength={200} defaultValue={s.contact.address} className={input} /></div>
          <button className={`${save} w-fit`}>Save contact</button>
        </form>

        <form action={saveChat} className={`${card} grid gap-4`}>
          <h2 className="font-display text-base font-semibold">AI shopping assistant</h2>
          <p className="text-xs text-muted">A chat button for visitors. It answers from your live products, prices, stock and delivery fees, plus the notes below. It needs GEMINI_API_KEY (free) or ANTHROPIC_API_KEY in your .env.local file.</p>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={s.chat.enabled} /> Show the chat button</label>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={label}>Assistant name</label><input name="name" required maxLength={40} defaultValue={s.chat.name} className={input} /></div>
            <div><label className={label}>First message</label><input name="greeting" required maxLength={200} defaultValue={s.chat.greeting} className={input} /></div>
          </div>
          <div><label className={label}>Store notes the assistant may use (return policy, delivery time, contact number, offers). Anything here can be shown to customers.</label><textarea name="knowledge" rows={6} maxLength={3000} defaultValue={s.chat.knowledge} className={input} /></div>
          <button className={`${save} w-fit`}>Save assistant</button>
        </form>

        <form action={saveBump} className={`${card} grid gap-4`}>
          <h2 className="font-display text-base font-semibold">Checkout extra offer (order bump)</h2>
          <p className="text-xs text-muted">One extra product offered with a checkbox on the checkout page. Leave the special price empty to use the normal price.</p>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={s.bump.enabled} /> Show this offer at checkout</label>
          <div><label className={label}>Product option</label>
            <select name="variantId" defaultValue={s.bump.variantId} className={input}>
              <option value="">None</option>
              {variants.map((v) => <option key={v.id} value={v.id}>{v.prod?.name} ({v.label})</option>)}
            </select>
          </div>
          <div><label className={label}>Headline</label><input name="headline" required maxLength={80} defaultValue={s.bump.headline} className={input} /></div>
          <div><label className={label}>Short text</label><input name="text" maxLength={200} defaultValue={s.bump.text} className={input} /></div>
          <div><label className={label}>Special price (optional)</label><input name="price" type="number" min={0} step="0.01" defaultValue={s.bump.price ?? ""} className={input} /></div>
          <button className={`${save} w-fit`}>Save offer</button>
        </form>

        <form action={saveProof} className={`${card} grid gap-4`}>
          <h2 className="font-display text-base font-semibold">Recent purchase notifications</h2>
          <p className="text-xs text-muted">Real mode shows only the first name, district, product and price from actual orders. Demo mode shows made-up purchases. Demo mode can mislead customers and may break advertising rules, so switch to Real once you have orders.</p>
          <select name="mode" defaultValue={s.proof.mode} className={input}>
            <option value="off">Off</option><option value="real">Real orders</option><option value="demo">Demo (made-up)</option>
          </select>
          <button className={`${save} w-fit`}>Save notifications</button>
        </form>
      </div>
    </>
  );
}
