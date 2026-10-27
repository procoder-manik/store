import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { BRAND } from "@/lib/config";

export type Settings = {
  announcement: { enabled: boolean; text: string; link: string };
  tracking: { fbPixel: string; ga4: string; gtm: string; gscToken: string; consent: boolean };
  popup: { enabled: boolean; title: string; text: string; code: string; button: string; trigger: "delay" | "exit"; delay: number };
  proof: { mode: "off" | "demo" | "real" };
  bump: { enabled: boolean; variantId: string; headline: string; text: string; price: number | null };
  chat: { enabled: boolean; name: string; greeting: string; knowledge: string };
  contact: { phone: string; whatsapp: string; email: string; address: string; hours: string };
  appearance: { theme: string; accent: string; visitorPicker: boolean; mode: "light" | "dark" | "system" };
  brand: { name: string; tagline: string; logo: string };
  header: { links: { label: string; href: string }[] };
  footer: { about: string; columns: { title: string; links: { label: string; href: string }[] }[]; copyright: string; newsletter: boolean };
};

export const DEFAULTS: Settings = {
  announcement: { enabled: true, text: "Cash on delivery available across Bangladesh", link: "" },
  tracking: { fbPixel: "", ga4: "", gtm: "", gscToken: "", consent: false },
  popup: { enabled: false, title: "Take 10% off your first order", text: "Use this code at checkout.", code: "WELCOME10", button: "Shop now", trigger: "delay", delay: 8 },
  proof: { mode: "off" },
  bump: { enabled: false, variantId: "", headline: "Add this to your order", text: "", price: null },
  chat: { enabled: false, name: "Shopping assistant", greeting: "Hi! Ask me about products, sizes, delivery or your order.", knowledge: "" },
  contact: { phone: "", whatsapp: "", email: "", address: "", hours: "" },
  appearance: { theme: "studio", accent: "", visitorPicker: true, mode: "light" },
  brand: { name: BRAND.name, tagline: BRAND.tagline, logo: "" },
  header: { links: [{ label: "Shop", href: "/shop" }] },
  footer: { about: "", columns: [], copyright: "", newsletter: true },
};

export function mergeSettings(rows: { key: string; value: unknown }[]): Settings {
  const out: Settings = { announcement: { ...DEFAULTS.announcement }, tracking: { ...DEFAULTS.tracking }, popup: { ...DEFAULTS.popup }, proof: { ...DEFAULTS.proof }, bump: { ...DEFAULTS.bump }, chat: { ...DEFAULTS.chat }, contact: { ...DEFAULTS.contact }, appearance: { ...DEFAULTS.appearance }, brand: { ...DEFAULTS.brand }, header: { ...DEFAULTS.header }, footer: { ...DEFAULTS.footer } };
  for (const r of rows) {
    const v = (r.value ?? {}) as object;
    if (r.key === "announcement") out.announcement = { ...out.announcement, ...v };
    if (r.key === "tracking") out.tracking = { ...out.tracking, ...v };
    if (r.key === "popup") out.popup = { ...out.popup, ...v };
    if (r.key === "proof") out.proof = { ...out.proof, ...v };
    if (r.key === "bump") out.bump = { ...out.bump, ...v };
    if (r.key === "chat") out.chat = { ...out.chat, ...v };
    if (r.key === "contact") out.contact = { ...out.contact, ...v };
    if (r.key === "appearance") {
      const a = v as { palette?: string; theme?: string };
      out.appearance = { ...out.appearance, ...v };
      // Older stores saved only a color. Keep it as the accent on top of the default theme.
      if (a.palette && !a.theme && a.palette !== "tide") out.appearance.accent = a.palette;
    }
    if (r.key === "brand") out.brand = { ...out.brand, ...v };
    if (r.key === "header") out.header = { ...out.header, ...v };
    if (r.key === "footer") out.footer = { ...out.footer, ...v };
  }
  return out;
}

export const getPublicSettings = cache(async (): Promise<Settings> => {
  const sb = createPublicClient();
  if (!sb) return DEFAULTS;
  const { data } = await sb.from("site_settings").select("key, value").eq("is_public", true);
  return mergeSettings((data ?? []) as { key: string; value: unknown }[]);
});
