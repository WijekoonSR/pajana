import { defineRouting } from "next-intl/routing";

// URL segment per locale: /en/..., /zh-tw/... and /zh-cn/...
export const LOCALE_PREFIXES = { en: "/en", "zh-TW": "/zh-tw", "zh-CN": "/zh-cn" } as const;

export const routing = defineRouting({
  // English (default), Traditional Chinese (Taiwan), Simplified Chinese (Mainland).
  locales: ["en", "zh-TW", "zh-CN"],
  defaultLocale: "en",
  localePrefix: { mode: "always", prefixes: LOCALE_PREFIXES },
  // English is the default; no Accept-Language or geo based redirects (SRS 07).
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
