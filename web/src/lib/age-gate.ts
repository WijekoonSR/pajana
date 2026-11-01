export const AGE_COOKIE = "age_ack";
export const AGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/** Only allow same-site relative paths as a post-gate destination. */
export function safeNextPath(next: string | undefined, fallback: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}
