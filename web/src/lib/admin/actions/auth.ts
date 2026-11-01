"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, AdminApiError, adminFetch, apiLogin } from "../api";
import { attempt, text } from "../form";
import type { ActionState } from "../types";

const COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/admin",
};

/** Only same-site admin paths, so ?next= cannot redirect off-site. */
function safeNext(value: string) {
  return value.startsWith("/admin") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : "/admin";
}

export async function login(_: ActionState, fd: FormData): Promise<ActionState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  let expiresAt: string;
  let token: string;
  try {
    ({ token, expiresAt } = await apiLogin(text(fd, "login"), String(fd.get("password") ?? ""), ip));
  } catch (e) {
    const error =
      e instanceof AdminApiError ? e.message : "Sign-in is unavailable. Is the API running?";
    return { ok: false, error, at: Date.now() };
  }
  (await cookies()).set(ADMIN_COOKIE, token, { ...COOKIE, expires: new Date(expiresAt) });
  redirect(safeNext(text(fd, "next")));
}

export async function logout() {
  try {
    await adminFetch("/auth/logout", { method: "POST" });
  } catch {
    // Already invalid; clearing the cookie is enough.
  }
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/admin/login");
}

export async function changePassword(_: ActionState, fd: FormData): Promise<ActionState> {
  const newPassword = String(fd.get("newPassword") ?? "");
  if (newPassword !== String(fd.get("confirmPassword") ?? "")) {
    return { ok: false, error: "New passwords do not match", at: Date.now() };
  }
  return attempt(
    () =>
      adminFetch("/auth/password", {
        method: "POST",
        body: { currentPassword: String(fd.get("currentPassword") ?? ""), newPassword },
      }),
    "Password changed. Other devices were signed out.",
  );
}
