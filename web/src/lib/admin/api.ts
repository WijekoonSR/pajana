import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ADMIN_COOKIE } from "./cookie";
import type { AdminUser } from "./types";

export { ADMIN_COOKIE };
const API_URL = process.env.API_URL ?? "http://localhost:4000";

/** A non-2xx response from the admin API, with a message safe to show the editor. */
export class AdminApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function messageOf(res: Response) {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    const msg = Array.isArray(body.message) ? body.message.join(". ") : body.message;
    if (msg) return msg;
  } catch {
    // fall through
  }
  return `Request failed (${res.status})`;
}

type Body = FormData | object | undefined;

/**
 * Calls /api/admin<path> with the signed-in editor's session token.
 * Server only: the token lives in an httpOnly cookie and never reaches the browser.
 */
export async function adminFetch<T>(
  path: string,
  init: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: Body } = {},
): Promise<T> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) redirect("/admin/login");

  const isForm = init.body instanceof FormData;
  const res = await fetch(new URL(`/api/admin${path}`, API_URL), {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body && !isForm ? { "Content-Type": "application/json" } : {}),
    },
    body: isForm ? (init.body as FormData) : init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  if (res.status === 401) redirect("/admin/login?expired=1");
  if (!res.ok) throw new AdminApiError(res.status, await messageOf(res));
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** The signed-in admin, once per request. Redirects to the login page otherwise. */
export const getAdmin = cache(() => adminFetch<AdminUser>("/auth/me"));

/** Public URL of an uploaded file, for previews in the admin panel. */
export function mediaUrl(path: string) {
  return new URL(`/uploads/${path.replace(/^\/+/, "")}`, API_URL).toString();
}

export async function apiLogin(login: string, password: string, clientIp: string) {
  const res = await fetch(new URL("/api/admin/auth/login", API_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Admin-Client-Ip": clientIp },
    body: JSON.stringify({ login, password }),
    cache: "no-store",
  });
  if (!res.ok) throw new AdminApiError(res.status, await messageOf(res));
  return (await res.json()) as { token: string; expiresAt: string; user: AdminUser };
}
