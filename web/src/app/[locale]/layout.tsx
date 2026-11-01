import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { locale as rootLocale } from "next/root-params";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getSettings } from "@/lib/api/client";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileCtaBar } from "@/components/layout/mobile-cta-bar";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Pages here are prerendered per locale, so the locale (a root param) is read
// outside Suspense on purpose. Opt out of the dev-only instant-navigation
// check that flags this as URL data (docs: adopting-partial-prefetching).
export const instant = false;

export const viewport: Viewport = {
  themeColor: "#c81d5c",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) return {};
  const [settings, t] = await Promise.all([
    getSettings(locale),
    getTranslations({ locale, namespace: "meta" }),
  ]);
  return {
    title: { default: settings.siteTitle, template: `%s | ${settings.siteTitle}` },
    description: settings.tagline || t("defaultDescription"),
    // SRS 09: staging must not be indexed. Flip via env at public launch.
    robots:
      process.env.ALLOW_INDEXING === "true"
        ? undefined
        : { index: false, follow: false },
  };
}

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();

  const [settings, t] = await Promise.all([
    getSettings(locale),
    getTranslations({ locale, namespace: "common" }),
  ]);

  return (
    <html lang={locale}>
      <body className="flex min-h-svh flex-col">
        <NextIntlClientProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
          >
            {t("skipToContent")}
          </a>
          <Header settings={settings} />
          <main id="main" className="flex-1 pb-24 md:pb-0">
            {children}
          </main>
          <Footer settings={settings} />
          <MobileCtaBar channels={settings.contactChannels} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
