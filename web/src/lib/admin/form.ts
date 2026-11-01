import "server-only";
import { refresh, updateTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { AdminApiError } from "./api";
import { ADMIN_LOCALES, type ActionState, type Localized } from "./types";

/** Reads `<name>.en`, `<name>.zh-TW`, `<name>.zh-CN` from a form. */
export function localizedFrom(fd: FormData, name: string): Localized {
  return Object.fromEntries(
    ADMIN_LOCALES.map((l) => [l, String(fd.get(`${name}.${l}`) ?? "")]),
  ) as Localized;
}

export function text(fd: FormData, name: string) {
  return String(fd.get(name) ?? "").trim();
}

export function checked(fd: FormData, name: string) {
  return fd.get(name) === "on" || fd.get(name) === "true";
}

/** Parses a JSON payload posted by a client-side editor. */
export function jsonFrom<T>(fd: FormData, name = "payload"): T {
  return JSON.parse(String(fd.get(name) ?? "null")) as T;
}

type PublicTag = "settings" | "pricing" | "profiles" | "schedule" | "pages";

/** Makes the public site show the change on its next request. */
export function refreshPublic(...tags: PublicTag[]) {
  for (const tag of tags) updateTag(tag);
}

/**
 * Runs a mutation and turns API errors into a message for the form.
 * Redirects (including to the login page) pass through.
 */
export async function attempt(
  run: () => Promise<unknown>,
  message = "Saved",
): Promise<ActionState> {
  try {
    await run();
    // Re-render the admin page with the saved data.
    refresh();
    return { ok: true, message, at: Date.now() };
  } catch (e) {
    unstable_rethrow(e);
    if (e instanceof AdminApiError) return { ok: false, error: e.message, at: Date.now() };
    console.error(e);
    return { ok: false, error: "Something went wrong. Please try again.", at: Date.now() };
  }
}
