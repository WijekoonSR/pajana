// English (default), Traditional Chinese (Taiwan), Simplified Chinese (Mainland).
export const LOCALES = ['en', 'zh-TW', 'zh-CN'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** Localized JSON column value, e.g. { "en": "Hello", "zh-TW": "你好", "zh-CN": "你好" }. */
export type Localized = Partial<Record<Locale, string>>;

/** Resolves a localized value, falling back to English when missing or empty. */
export function localize(value: unknown, locale: Locale): string {
  if (!value || typeof value !== 'object') return '';
  const map = value as Localized;
  return map[locale] || map[DEFAULT_LOCALE] || '';
}
