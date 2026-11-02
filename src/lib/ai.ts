import "server-only";
import { activeProviders, providerById, type Resolved } from "@/lib/ai-config";

export type Msg = { role: "user" | "assistant"; content: string };
type R = { ok: true; text: string; via?: string } | { ok: false; error: string };
type Opts = { json?: boolean; maxTokens?: number; temperature?: number };
type Fail = { error: string; status: number };

const ATTEMPT_MS = 9_000;
const BUDGET_MS = 24_000;

// A service that has run out, or has a wrong key, is skipped for a while so customers never wait on it.
const resting = new Map<string, number>();
const rest = (key: string, minutes: number) => resting.set(key, Date.now() + minutes * 60_000);
const isResting = (key: string) => (resting.get(key) ?? 0) > Date.now();

function restFor(p: Resolved, model: string, status: number) {
  if (status === 401 || status === 403 || status === 402) rest(p.id, 30);
  else if (status === 429) rest(`${p.id}:${model}`, 20);
  else if (status === 400 || status === 404) rest(`${p.id}:${model}`, 60);
  else rest(`${p.id}:${model}`, 1);
}

/** Some models think out loud first. Customers must only see the answer. */
const clean = (t: string) => t.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^\s*<think>[\s\S]*$/i, "").trim();

async function ask(p: Resolved, model: string, system: string, messages: Msg[], o: Opts, max: number, timeout: number): Promise<{ ok: true; text: string } | ({ ok: false } & Fail)> {
  const signal = AbortSignal.timeout(timeout);
  const temperature = o.temperature;
  try {
    if (p.kind === "gemini") {
      const res = await fetch(`${p.baseUrl}/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": p.key },
        signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
          generationConfig: {
            ...(o.json ? { responseMimeType: "application/json" } : {}),
            ...(model.includes("2.5") ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
            ...(temperature != null ? { temperature } : {}),
            maxOutputTokens: max,
          },
        }),
      });
      if (!res.ok) return { ok: false, status: res.status, error: `${p.name} ${model}: ${res.status} ${(await res.text()).replace(/\s+/g, " ").slice(0, 140)}` };
      const j = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = clean((j.candidates?.[0]?.content?.parts ?? []).map((x) => x.text ?? "").join(""));
      return text ? { ok: true, text } : { ok: false, status: 204, error: `${p.name} ${model}: empty reply` };
    }

    if (p.kind === "anthropic") {
      const res = await fetch(`${p.baseUrl}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": p.key, "anthropic-version": "2023-06-01" },
        signal,
        body: JSON.stringify({ model, max_tokens: max, system, messages, ...(temperature != null ? { temperature } : {}) }),
      });
      if (!res.ok) return { ok: false, status: res.status, error: `${p.name} ${model}: ${res.status} ${(await res.text()).replace(/\s+/g, " ").slice(0, 140)}` };
      const j = (await res.json()) as { content?: { type: string; text?: string }[] };
      const text = clean((j.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join(""));
      return text ? { ok: true, text } : { ok: false, status: 204, error: `${p.name} ${model}: empty reply` };
    }

    const send = (json: boolean) => fetch(`${p.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${p.key}`, ...(p.id === "openrouter" ? { "x-title": "Store assistant" } : {}) },
      signal,
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, ...messages],
        max_tokens: max,
        ...(temperature != null ? { temperature } : {}),
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    let res = await send(!!o.json);
    // Not every service knows JSON mode. The prompt already asks for JSON, so ask again without it.
    if (o.json && res.status === 400) res = await send(false);
    if (!res.ok) return { ok: false, status: res.status, error: `${p.name} ${model}: ${res.status} ${(await res.text()).replace(/\s+/g, " ").slice(0, 140)}` };
    const j = (await res.json()) as { choices?: { message?: { content?: string | null } }[] };
    const text = clean(j.choices?.[0]?.message?.content ?? "");
    return text ? { ok: true, text } : { ok: false, status: 204, error: `${p.name} ${model}: empty reply` };
  } catch (e) {
    const slow = (e as Error).name === "TimeoutError" || (e as Error).name === "AbortError";
    return { ok: false, status: 0, error: `${p.name} ${model}: ${slow ? "did not answer in time" : "could not connect"}` };
  }
}

/**
 * One place for every AI call. Tries the services in the order set in Admin, AI services, and moves to the next
 * model or service when one is out of free requests, so a customer never sees the switch.
 */
export async function chatAI(system: string, messages: Msg[], opts: Opts = {}): Promise<R> {
  const providers = await activeProviders();
  if (!providers.length) return { ok: false, error: "No AI service is connected. Add a key in Admin, AI services, or set GEMINI_API_KEY in the .env file." };
  const max = opts.maxTokens ?? 1500;
  const start = Date.now();
  let last = "Could not reach any AI service.";
  for (const p of providers) {
    if (isResting(p.id)) continue;
    for (const model of p.models) {
      if (isResting(`${p.id}:${model}`)) continue;
      if (isResting(p.id)) break;
      const left = BUDGET_MS - (Date.now() - start);
      if (left < 2_000) return { ok: false, error: last };
      const r = await ask(p, model, system, messages, opts, max, Math.min(ATTEMPT_MS, left));
      if (r.ok) return { ok: true, text: r.text, via: `${p.id}:${model}` };
      last = r.error;
      restFor(p, model, r.status);
    }
  }
  // Everything was resting. Try once more, ignoring the pause, rather than turning a customer away.
  if (resting.size) {
    resting.clear();
    for (const p of providers) {
      const left = BUDGET_MS - (Date.now() - start);
      if (left < 2_000) break;
      const r = await ask(p, p.models[0], system, messages, opts, max, Math.min(ATTEMPT_MS, left));
      if (r.ok) return { ok: true, text: r.text, via: `${p.id}:${p.models[0]}` };
      last = r.error;
    }
  }
  return { ok: false, error: last };
}

export const callAI = (system: string, user: string, json: boolean) => chatAI(system, [{ role: "user", content: user }], { json });

export type Probe = { ok: boolean; ms: number; model: string; reply?: string; error?: string; available?: string[] };

/** Admin's Test button: asks one service a tiny question with each of its models, and lists the model names its key can use. */
export async function probeProvider(id: string): Promise<Probe> {
  const p = await providerById(id);
  if (!p) return { ok: false, ms: 0, model: "", error: "No key is set for this service yet." };
  const t0 = Date.now();
  let error = "";
  for (const model of p.models) {
    const r = await ask(p, model, "Reply with the single word: ok", [{ role: "user", content: "Say it." }], { temperature: 0 }, 60, 15_000);
    if (r.ok) { resting.delete(`${p.id}:${model}`); resting.delete(p.id); return { ok: true, ms: Date.now() - t0, model, reply: r.text.slice(0, 40) }; }
    error = r.error;
    if (r.status === 401 || r.status === 403) break;
  }
  return { ok: false, ms: Date.now() - t0, model: p.models[0] ?? "", error, available: await listModels(p) };
}

async function listModels(p: Resolved): Promise<string[]> {
  try {
    if (p.kind === "anthropic") return [];
    const url = p.kind === "gemini" ? `${p.baseUrl}/models?pageSize=100` : `${p.baseUrl.replace(/\/$/, "")}/models`;
    const res = await fetch(url, { headers: p.kind === "gemini" ? { "x-goog-api-key": p.key } : { authorization: `Bearer ${p.key}` }, signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return [];
    const j = (await res.json()) as { data?: { id: string }[]; models?: { name: string; supportedGenerationMethods?: string[] }[] };
    const ids = p.kind === "gemini" ? (j.models ?? []).filter((m) => m.supportedGenerationMethods?.includes("generateContent")).map((m) => m.name.replace(/^models\//, "")) : (j.data ?? []).map((m) => m.id);
    return ids.slice(0, 24);
  } catch {
    return [];
  }
}
