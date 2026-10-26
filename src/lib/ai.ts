import "server-only";

export type Msg = { role: "user" | "assistant"; content: string };
type R = { ok: true; text: string } | { ok: false; error: string };

/** One place for every AI call. Uses Gemini (free key) when set, otherwise Claude. */
export async function chatAI(system: string, messages: Msg[], opts: { json?: boolean; maxTokens?: number } = {}): Promise<R> {
  const gemini = process.env.GEMINI_API_KEY;
  const claude = process.env.ANTHROPIC_API_KEY;
  if (!gemini && !claude) return { ok: false, error: "Add GEMINI_API_KEY (free) or ANTHROPIC_API_KEY to .env.local and restart the server." };
  const max = opts.maxTokens ?? 1500;
  try {
    if (gemini) {
      const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": gemini },
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
      if (!res.ok) return { ok: false, error: `AI request failed (${res.status}). ${(await res.text()).slice(0, 160)}` };
      const j = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      return { ok: true, text: (j.candidates?.[0]?.content?.parts ?? []).map((x) => x.text ?? "").join("") };
    }
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": claude as string, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5", max_tokens: max, system, messages }),
    });
    if (!res.ok) return { ok: false, error: `AI request failed (${res.status}). ${(await res.text()).slice(0, 160)}` };
    const j = (await res.json()) as { content?: { type: string; text?: string }[] };
    return { ok: true, text: (j.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("") };
  } catch {
    return { ok: false, error: "Could not reach the AI service. Check your internet connection." };
  }
}

export const callAI = (system: string, user: string, json: boolean) => chatAI(system, [{ role: "user", content: user }], { json });
