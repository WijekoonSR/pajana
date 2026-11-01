"use client";

import { useActionState } from "react";
import { login } from "@/lib/admin/actions/auth";
import { btn, input, label } from "@/components/admin/styles";
import type { ActionState } from "@/lib/admin/types";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, { ok: true } as ActionState);
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      {state.error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="login" className={label}>
          Login
        </label>
        <input
          id="login"
          name="login"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          autoFocus
          className={input}
        />
      </div>
      <div>
        <label htmlFor="password" className={label}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={input}
        />
      </div>
      <button type="submit" disabled={pending} className={`${btn.primary} w-full py-2.5`}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
