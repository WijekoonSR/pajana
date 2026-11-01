"use client";

import { createContext, use, useCallback, useState, type ReactNode } from "react";

interface Toast {
  id: number;
  ok: boolean;
  text: string;
}

const ToastContext = createContext<(ok: boolean, text: string) => void>(() => {});

/** Bottom-right status messages for admin actions (announced to screen readers). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((ok: boolean, text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, ok, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ok ? 3500 : 7000);
  }, []);

  return (
    <ToastContext value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:left-auto"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.ok ? "status" : "alert"}
            className={`pointer-events-auto max-w-sm rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg ${
              t.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-900"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  return use(ToastContext);
}
