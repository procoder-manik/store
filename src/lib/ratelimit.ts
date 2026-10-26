import "server-only";
import { headers } from "next/headers";

const mem = new Map<string, { n: number; reset: number }>();

export async function clientIp(): Promise<string> {
  const h = await headers();
  const raw = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "").split(",")[0].trim();
  return /^[0-9a-fA-F:.]{3,45}$/.test(raw) ? raw : "unknown";
}

/**
 * Fixed-window limiter. Uses Upstash Redis when its keys are set (shared across servers),
 * otherwise falls back to memory on this one server. Returns false when the limit is exceeded.
 */
export async function rateLimit(key: string, max: number, windowSec: number): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      const k = `rl:${key}`;
      const res = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify([["INCR", k], ["EXPIRE", k, String(windowSec), "NX"]]),
        cache: "no-store",
      });
      if (res.ok) {
        const j = (await res.json()) as { result: number }[];
        return Number(j[0]?.result) <= max;
      }
    } catch {
      // fall through to the in-memory limiter
    }
  }
  const now = Date.now();
  const e = mem.get(key);
  if (!e || e.reset < now) {
    if (mem.size > 5000) mem.clear();
    mem.set(key, { n: 1, reset: now + windowSec * 1000 });
    return true;
  }
  e.n += 1;
  return e.n <= max;
}
