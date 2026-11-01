import "server-only";

export type Msg = { role: "user" | "assistant"; content: string };
type R = { ok: true; text: string } | { ok: false; error: string };

// Google's free plan counts requests per model per day, and some models allow as few as 20, so when one runs out the next one answers.
const GEMINI_MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-2.5-flash"];
const WAIT_MS = 15_000;

async function askGemini(key: string, model: string, system: string, messages: Msg[], opts: { json?: boolean }, max: number): Promise<R> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    signal: AbortSignal.timeout(WAIT_MS),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      generationConfig: {
        ...(opts.json ? { responseMimeType: "application/json" } : {}),
        ...(model.includes("2.5") ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        maxOutputTokens: max,
      },
    }),
  });
  if (!res.ok) return { ok: false, error: `AI request failed on ${model} (${res.status}). ${(await res.text()).slice(0, 160)}` };
  const j = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = (j.candidates?.[0]?.content?.parts ?? []).map((x) => x.text ?? "").join("");
  return text.trim() ? { ok: true, text } : { ok: false, error: `${model} returned an empty reply.` };
}

/** One place for every AI call. Uses Gemini (free key) when set, then Claude if that key is set too. */
export async function chatAI(system: string, messages: Msg[], opts: { json?: boolean; maxTokens?: number } = {}): Promise<R> {
  const gemini = process.env.GEMINI_API_KEY;
  const claude = process.env.ANTHROPIC_API_KEY;
  if (!gemini && !claude) return { ok: false, error: "Add GEMINI_API_KEY (free) or ANTHROPIC_API_KEY to .env.local and restart the server." };
  const max = opts.maxTokens ?? 1500;
  let last: R = { ok: false, error: "Could not reach the AI service. Check your internet connection." };
  if (gemini) {
    const chosen = process.env.GEMINI_MODEL;
    for (const model of chosen ? [chosen, ...GEMINI_MODELS.filter((m) => m !== chosen)] : GEMINI_MODELS) {
      try {
        last = await askGemini(gemini, model, system, messages, opts, max);
        if (last.ok) return last;
      } catch {
        last = { ok: false, error: `${model} did not answer in time.` };
      }
    }
  }
  if (!claude) return last;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": claude, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5", max_tokens: max, system, messages }),
    });
    if (!res.ok) return { ok: false, error: `AI request failed (${res.status}). ${(await res.text()).slice(0, 160)}` };
    const j = (await res.json()) as { content?: { type: string; text?: string }[] };
    return { ok: true, text: (j.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("") };
  } catch {
    return last;
  }
}

export const callAI = (system: string, user: string, json: boolean) => chatAI(system, [{ role: "user", content: user }], { json });
