import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-night px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-primary-soft/25 blur-3xl"
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="flex items-center justify-center gap-2">
            <span className="text-brand-gradient font-brand text-4xl font-black tracking-[0.14em]">粉色誘惑</span>
            <span className="text-3xl" aria-hidden="true">🫦</span>
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.3em] text-night-ink/60">
            Content management
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white p-7 shadow-2xl">
          <h1 className="text-lg font-bold text-ink">Sign in</h1>
          <p className="mt-1 text-sm text-muted">Authorized staff only. Activity is logged.</p>
          <Suspense>
            <LoginNotice searchParams={searchParams} />
          </Suspense>
          <Suspense>
            <LoginFormWithNext searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function LoginNotice({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  const { expired } = await searchParams;
  if (!expired) return null;
  return (
    <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
      Your session ended. Please sign in again.
    </p>
  );
}

async function LoginFormWithNext({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  const { next } = await searchParams;
  return <LoginForm next={typeof next === "string" ? next : "/admin"} />;
}
