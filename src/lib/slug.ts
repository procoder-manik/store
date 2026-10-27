import { slugify } from "@/lib/utils";

/** An address from the typed name. Names written only in Bangla have no Latin letters, so they get a short generated address. */
export function makeSlug(typed: string, name: string, prefix: string) {
  const s = slugify(typed || name);
  return s || `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}
