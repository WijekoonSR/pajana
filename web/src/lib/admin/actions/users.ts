"use server";

import { adminFetch } from "../api";
import { attempt, text } from "../form";
import type { ActionState } from "../types";

export async function createUser(_: ActionState, fd: FormData) {
  return attempt(
    () =>
      adminFetch("/users", {
        method: "POST",
        body: {
          login: text(fd, "login"),
          password: String(fd.get("password") ?? ""),
          role: text(fd, "role"),
        },
      }),
    "Account created. Share the password through a secure channel.",
  );
}

export async function updateUser(id: string, _: ActionState, fd: FormData) {
  const password = String(fd.get("password") ?? "");
  return attempt(
    () =>
      adminFetch(`/users/${id}`, {
        method: "PATCH",
        body: {
          role: text(fd, "role"),
          status: text(fd, "status"),
          ...(password ? { password } : {}),
        },
      }),
    password ? "Saved and password reset. The user was signed out." : "Saved",
  );
}
