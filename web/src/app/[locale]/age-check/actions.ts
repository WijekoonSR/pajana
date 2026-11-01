"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AGE_COOKIE, AGE_COOKIE_MAX_AGE, safeNextPath } from "@/lib/age-gate";

export async function acknowledgeAge(formData: FormData) {
  const fallback = String(formData.get("home") ?? "/");
  const next = safeNextPath(formData.get("next")?.toString(), fallback);

  (await cookies()).set(AGE_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AGE_COOKIE_MAX_AGE,
  });
  redirect(next);
}
