"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { GlobeIcon } from "@/components/ui/icons";

const LABELS: Record<Locale, string> = {
  en: "EN",
  "zh-TW": "繁中",
  "zh-CN": "简中",
};
const NAMES: Record<Locale, string> = {
  en: "English",
  "zh-TW": "繁體中文（台灣）",
  "zh-CN": "简体中文",
};

/** Same page and query in the target locale (SRS 06: stay on the deep-linked page). */
function useCurrentHref() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  return search ? `${pathname}?${search}` : pathname;
}

/** Tablet/desktop: segmented control. */
function Segmented() {
  const t = useTranslations("common");
  const current = useLocale();
  const href = useCurrentHref();

  return (
    <div
      role="group"
      aria-label={t("language")}
      className="hidden items-center gap-0.5 rounded-full border border-border bg-surface p-0.5 text-xs font-bold sm:inline-flex"
    >
      <GlobeIcon className="mx-1 text-muted" width={14} height={14} />
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href={href}
          locale={locale}
          lang={locale}
          hrefLang={locale}
          title={NAMES[locale]}
          aria-current={locale === current ? "true" : undefined}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            locale === current ? "bg-primary text-white" : "text-muted hover:text-primary"
          }`}
        >
          {LABELS[locale]}
        </Link>
      ))}
    </div>
  );
}

/** Phones: one compact button with a menu, so the logo keeps its space. */
function Dropdown() {
  const t = useTranslations("common");
  const current = useLocale();
  const href = useCurrentHref();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative sm:hidden">
      <button
        type="button"
        aria-label={`${t("language")}: ${NAMES[current]}`}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-1 rounded-full border border-border bg-surface px-3 text-xs font-bold text-primary"
      >
        <GlobeIcon width={14} height={14} />
        {LABELS[current]}
        <span aria-hidden="true" className={`text-[9px] transition-transform ${open ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>
      {open && (
        <ul
          id={menuId}
          className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-border bg-surface py-1 shadow-xl shadow-primary/15"
        >
          {routing.locales.map((locale) => (
            <li key={locale}>
              <Link
                href={href}
                locale={locale}
                lang={locale}
                hrefLang={locale}
                aria-current={locale === current ? "true" : undefined}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                  locale === current ? "bg-surface-2 font-bold text-primary" : "text-ink hover:bg-surface-2"
                }`}
              >
                {NAMES[locale]}
                {locale === current && <span aria-hidden="true">✓</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function LanguageSwitcher() {
  return (
    <Suspense fallback={<div className="h-10 w-16 sm:h-7 sm:w-36" />}>
      <Dropdown />
      <Segmented />
    </Suspense>
  );
}
