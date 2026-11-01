"use client";

import { useTranslations } from "next-intl";

// Friendly error state instead of raw system messages (SRS 08).
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <p className="text-brand-gradient font-display text-5xl font-bold">Oops</p>
      <h1 className="mt-4 text-xl font-bold">{t("errorTitle")}</h1>
      <p className="mt-2 text-sm text-muted">{t("errorBody")}</p>
      <button
        type="button"
        onClick={reset}
        className="bg-brand-gradient mt-8 rounded-full px-6 py-3 text-sm font-bold text-white"
      >
        {t("retry")}
      </button>
    </div>
  );
}
