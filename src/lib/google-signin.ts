import "server-only";

/**
 * With these two set, Google talks to the store's own address instead of Supabase's, so the sign in screen
 * no longer names a random supabase.co address. Without them, sign in still works through Supabase.
 */
export const googleDirect = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const GOOGLE_COOKIE = "google-signin";

/** Only same-site paths, so a crafted link cannot send someone to another website after signing in. */
export const safePath = (n: string | null | undefined) => (n && /^\/(?![/\\])/.test(n) && !/[\\\r\n]/.test(n) ? n : "/");
