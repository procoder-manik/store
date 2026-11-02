"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { probeProvider, type Probe } from "@/lib/ai";
import { loadSaved, seal, writeSaved, type SavedProvider } from "@/lib/ai-config";
import { providerDef } from "@/lib/ai-providers";

type Done = { ok: true } | { ok: false; error: string };

/** Only public https addresses. A custom connection is called from the server, so it must not reach private networks. */
function safeUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    const h = u.hostname.toLowerCase();
    if (u.protocol !== "https:" || u.username || u.password) return null;
    if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || !h.includes(".")) return null;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(h) || h.includes(":")) return null;
    return u.origin + u.pathname.replace(/\/$/, "");
  } catch {
    return null;
  }
}

const models = (s: string) => [...new Set(s.split(/[\n,]+/).map((m) => m.trim()).filter(Boolean))].slice(0, 12);
const modelOk = (m: string) => /^[\w./:@+-]{1,100}$/.test(m);

const saveSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{2,40}$/),
  key: z.string().trim().max(400).optional(),
  enabled: z.boolean(),
  models: z.string().max(600),
  order: z.number().int().min(1).max(99),
});

export async function saveProvider(input: unknown): Promise<Done> {
  const p = saveSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  try { await requireAdmin("ai.save"); } catch (e) { return { ok: false, error: (e as Error).message }; }
  const d = p.data;
  const saved = await loadSaved();
  const old = saved.providers[d.id];
  if (!providerDef(d.id) && !old?.custom) return { ok: false, error: "Unknown service." };
  const list = models(d.models);
  if (list.some((m) => !modelOk(m))) return { ok: false, error: "A model name has a character that is not allowed." };
  const next: SavedProvider = { ...old, enabled: d.enabled, order: d.order, models: list };
  if (d.key) {
    if (/\s/.test(d.key) || d.key.length < 8) return { ok: false, error: "That does not look like a key. Copy it again without spaces." };
    next.key = seal(d.key);
  }
  saved.providers[d.id] = next;
  try { await writeSaved(saved); } catch (e) { return { ok: false, error: (e as Error).message }; }
  revalidatePath("/admin/ai");
  return { ok: true };
}

export async function removeKey(id: string): Promise<Done> {
  try { await requireAdmin("ai.remove-key"); } catch (e) { return { ok: false, error: (e as Error).message }; }
  const saved = await loadSaved();
  const cur = saved.providers[id];
  if (!cur) return { ok: true };
  if (cur.custom) delete saved.providers[id];
  else saved.providers[id] = { ...cur, key: undefined };
  try { await writeSaved(saved); } catch (e) { return { ok: false, error: (e as Error).message }; }
  revalidatePath("/admin/ai");
  return { ok: true };
}

const customSchema = z.object({
  name: z.string().trim().min(2, "Give it a name").max(40),
  baseUrl: z.string().trim().max(200),
  key: z.string().trim().min(8, "Paste the key").max(400).regex(/^\S+$/, "The key has spaces in it"),
  models: z.string().max(600),
});

export async function addCustom(input: unknown): Promise<Done> {
  const p = customSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  try { await requireAdmin("ai.add-custom"); } catch (e) { return { ok: false, error: (e as Error).message }; }
  const url = safeUrl(p.data.baseUrl);
  if (!url) return { ok: false, error: "The address must start with https:// and be a public website." };
  const list = models(p.data.models);
  if (!list.length || list.some((m) => !modelOk(m))) return { ok: false, error: "Add at least one model name, like gpt-4o-mini." };
  const saved = await loadSaved();
  const id = `custom-${p.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "service"}`;
  if (saved.providers[id]) return { ok: false, error: "A connection with this name already exists." };
  saved.providers[id] = { custom: true, name: p.data.name, baseUrl: url, key: seal(p.data.key), models: list, enabled: true, order: 50 };
  try { await writeSaved(saved); } catch (e) { return { ok: false, error: (e as Error).message }; }
  revalidatePath("/admin/ai");
  return { ok: true };
}

export async function testProvider(id: string): Promise<Probe> {
  try { await requireAdmin("ai.test"); } catch (e) { return { ok: false, ms: 0, model: "", error: (e as Error).message }; }
  return probeProvider(z.string().regex(/^[a-z0-9-]{2,40}$/).parse(id));
}
