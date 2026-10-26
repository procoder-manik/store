export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);

export const IMAGE_HOSTS = ["images.pexels.com", "images.unsplash.com", "cdn.pixabay.com"];

export function isAllowedImageUrl(u: string) {
  try {
    const x = new URL(u);
    return x.protocol === "https:" && IMAGE_HOSTS.includes(x.hostname);
  } catch {
    return false;
  }
}

export const imageUrl = (path: string) =>
  path.startsWith("https://") ? path : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;

/** Returns a Bangladeshi mobile number as 01XXXXXXXXX, or null if invalid. */
export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("+880")) d = "0" + d.slice(4);
  else if (d.startsWith("880")) d = "0" + d.slice(3);
  return /^01[3-9]\d{8}$/.test(d) ? d : null;
}
