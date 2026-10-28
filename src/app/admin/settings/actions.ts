"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { isLogoUrl, normalizePhone } from "@/lib/utils";
import { isPalette } from "@/lib/palettes";
import { isTheme } from "@/lib/themes";

function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const r = schema.safeParse(data);
  if (!r.success) throw new Error(r.error.issues[0].message);
  return r.data;
}

async function save(key: string, value: object) {
  const { supabase } = await requireAdmin(`settings.${key}`);
  const { error } = await supabase.from("site_settings").upsert({ key, value, is_public: true });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  revalidatePath("/api/social-proof");
}

const on = (v: FormDataEntryValue | null) => v === "on";

export async function saveAnnouncement(fd: FormData) {
  const d = parse(z.object({
    text: z.string().trim().max(160),
    link: z.string().trim().max(200).refine((v) => v === "" || v.startsWith("/") || v.startsWith("https://"), "The link must start with / or https://"),
  }), { text: fd.get("text"), link: fd.get("link") });
  await save("announcement", { enabled: on(fd.get("enabled")), ...d });
}

export async function saveTracking(fd: FormData) {
  const d = parse(z.object({
    fbPixel: z.string().trim().regex(/^(\d{5,20})?$/, "Facebook Pixel ID is only digits"),
    ga4: z.string().trim().toUpperCase().regex(/^(G-[A-Z0-9]{4,15})?$/, "GA4 ID looks like G-XXXXXXXXXX"),
    gtm: z.string().trim().toUpperCase().regex(/^(GTM-[A-Z0-9]{4,10})?$/, "Tag Manager ID looks like GTM-XXXXXXX"),
    gscToken: z.string().trim().regex(/^([A-Za-z0-9_-]{10,100})?$/, "Paste only the content value of the Search Console meta tag"),
  }), { fbPixel: fd.get("fbPixel"), ga4: fd.get("ga4"), gtm: fd.get("gtm"), gscToken: fd.get("gscToken") });
  await save("tracking", { ...d, consent: on(fd.get("consent")) });
}

export async function savePopup(fd: FormData) {
  const d = parse(z.object({
    title: z.string().trim().min(1, "Add a popup title").max(80),
    text: z.string().trim().max(240),
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{0,30}$/, "Coupon code can use letters, numbers, dashes and underscores"),
    button: z.string().trim().max(30),
    trigger: z.enum(["delay", "exit"]),
    delay: z.coerce.number().int().min(3).max(120),
  }), { title: fd.get("title"), text: fd.get("text"), code: fd.get("code"), button: fd.get("button"), trigger: fd.get("trigger"), delay: fd.get("delay") });
  await save("popup", { enabled: on(fd.get("enabled")), ...d });
}

export async function saveProof(fd: FormData) {
  const d = parse(z.object({ mode: z.enum(["off", "demo", "real"]) }), { mode: fd.get("mode") });
  await save("proof", d);
}

export async function saveBump(fd: FormData) {
  const d = parse(z.object({
    variantId: z.union([z.literal(""), z.string().uuid()]),
    headline: z.string().trim().min(1, "Add a headline for the offer").max(80),
    text: z.string().trim().max(200),
    price: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().min(0).max(10_000_000).nullable()),
  }), { variantId: fd.get("variantId"), headline: fd.get("headline"), text: fd.get("text"), price: fd.get("price") });
  await save("bump", { enabled: on(fd.get("enabled")) && d.variantId !== "", ...d });
}

export async function saveChat(fd: FormData) {
  const d = parse(z.object({
    name: z.string().trim().min(1, "Give the assistant a name").max(40),
    greeting: z.string().trim().min(1, "Add a greeting").max(200),
    knowledge: z.string().trim().max(3000),
    avatar: z.string().trim().max(500).refine((v) => v === "" || isLogoUrl(v), "The picture must be uploaded here or come from Pexels, Unsplash or Pixabay"),
    waNote: z.string().trim().max(200),
    waNumber: bd,
  }), { name: fd.get("name"), greeting: fd.get("greeting"), knowledge: fd.get("knowledge"), avatar: fd.get("avatar") ?? "", waNote: fd.get("waNote") ?? "", waNumber: fd.get("waNumber") ?? "" });
  await save("chat", { enabled: on(fd.get("enabled")), ...d, waNumber: d.waNumber ? `88${d.waNumber}` : "", waEnabled: on(fd.get("waEnabled")) });
}

const bd = z.string().trim().transform((v, ctx) => {
  if (!v) return "";
  const p = normalizePhone(v);
  if (!p) { ctx.addIssue({ code: "custom", message: "Enter a valid mobile number, like 01712345678" }); return ""; }
  return p;
});

export async function saveContact(fd: FormData) {
  const d = parse(z.object({
    phone: bd, whatsapp: bd,
    email: z.union([z.literal(""), z.string().trim().toLowerCase().email("Enter a valid email address").max(120)]),
    address: z.string().trim().max(200),
    hours: z.string().trim().max(120),
    businessName: z.string().trim().max(80),
    phone2: bd,
    mapUrl: z.string().trim().max(500).refine((v) => v === "" || v.startsWith("https://"), "The map link must start with https://"),
  }), { phone: fd.get("phone") ?? "", whatsapp: fd.get("whatsapp") ?? "", email: fd.get("email") ?? "", address: fd.get("address") ?? "", hours: fd.get("hours") ?? "", businessName: fd.get("businessName") ?? "", phone2: fd.get("phone2") ?? "", mapUrl: fd.get("mapUrl") ?? "" });
  await save("contact", { phone: d.phone, whatsapp: d.whatsapp ? `88${d.whatsapp}` : "", email: d.email, address: d.address, hours: d.hours, businessName: d.businessName, phone2: d.phone2, mapUrl: d.mapUrl });
}

export async function saveAppearance(fd: FormData) {
  const theme = String(fd.get("theme") ?? "");
  const accent = String(fd.get("accent") ?? "");
  const mode = String(fd.get("mode") ?? "light");
  const buttons = String(fd.get("buttons") ?? "round");
  if (!["round", "soft", "square", "theme"].includes(buttons)) throw new Error("Choose a button shape");
  if (!isTheme(theme)) throw new Error("Choose one of the themes");
  if (accent && !isPalette(accent)) throw new Error("Choose one of the accent colors");
  if (!["light", "dark", "system"].includes(mode)) throw new Error("Choose a mode");
  await save("appearance", { theme, accent, mode, buttons, visitorPicker: on(fd.get("visitorPicker")) });
}

export async function saveExtras(fd: FormData) {
  await save("extras", { backToTop: on(fd.get("backToTop")), catalog: on(fd.get("catalog")) });
}
