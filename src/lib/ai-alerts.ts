import "server-only";
import { SITE_URL } from "@/lib/config";

/** Why a service stopped working, in words the owner can act on. */
export type DownKind = "limit" | "payment" | "key";
export type DownProvider = { id: string; name: string; kind: DownKind };
export type FailureReport = { down: DownProvider[]; allFailed: boolean; lastError: string };

// One warning about the same thing at a time. A fresh warning only goes out once this long has passed.
const GAP_MS = 12 * 60 * 60 * 1000;
const lastSent = new Map<string, number>();
function fresh(id: string): boolean {
  const t = lastSent.get(id) ?? 0;
  if (Date.now() - t < GAP_MS) return false;
  lastSent.set(id, Date.now());
  return true;
}

const reason: Record<DownKind, string> = {
  limit: "has used up its free requests for now",
  payment: "needs a paid plan or billing turned on",
  key: "key was rejected — it is wrong, expired, or has no access",
};

/**
 * Emails the store owner when an AI service runs out or every service fails.
 * Safe to await on any path: it does nothing (no database, no email) unless there
 * is a genuinely new problem, and it never throws into a customer's chat.
 */
export async function reportAiFailures({ down, allFailed, lastError }: FailureReport): Promise<void> {
  try {
    const newDown = down.filter((d) => fresh(`down:${d.id}`));
    const newAllFailed = allFailed && fresh("all-failed");
    if (!newDown.length && !newAllFailed) return;

    const { getPublicSettings } = await import("@/lib/settings");
    const { contact } = await getPublicSettings();
    const to = contact.email?.trim();
    if (!to) return; // No store email set in Admin, Contact — nowhere to send the warning.

    const { sendEmails, emailConfigured } = await import("@/lib/email");
    if (!emailConfigured()) return;

    const link = `${SITE_URL}/admin/ai`;
    const bullets = newDown.map((d) => `${d.name} ${reason[d.kind]}.`);

    const subject = newAllFailed
      ? "⚠️ Your store assistant is offline — no AI is answering"
      : newDown.length === 1
        ? `⚠️ ${newDown[0].name} AI needs your attention`
        : "⚠️ Some AI services need your attention";

    const intro = newAllFailed
      ? `Your store assistant could not answer because every AI service failed. Customers are seeing the fallback reply until one works again. Last message from the services: ${lastError}`
      : "One or more AI services stopped working. The assistant switched to a backup automatically, so customers are still getting answers — but please add or refresh a key so a backup stays ready.";

    const list = bullets.length
      ? `\n\nWhat happened:\n${bullets.map((b) => `• ${b}`).join("\n")}`
      : "";

    const text = `${intro}${list}\n\nFix it in your admin: ${link}\nAdd a new free key or reorder the services so a working one is first.`;

    const htmlBullets = bullets.length
      ? `<ul style="margin:16px 0;padding-left:20px">${bullets.map((b) => `<li style="margin:4px 0">${b}</li>`).join("")}</ul>`
      : "";
    const html = `<p>${intro}</p>${htmlBullets}<p><a href="${link}" style="display:inline-block;padding:10px 18px;border-radius:999px;background:#111;color:#fff;text-decoration:none">Open AI services</a></p><p style="color:#666;font-size:13px">Add a new free key, or drag a working service to the top so it is tried first.</p>`;

    await sendEmails([{ to, subject, html, text }], "ai_alert");
  } catch {
    // A warning email must never break a customer's chat.
  }
}
