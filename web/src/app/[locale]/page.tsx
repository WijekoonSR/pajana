import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPage, getProfiles, getSchedule, getSettings } from "@/lib/api/client";
import { ProfileCard } from "@/components/cast/profile-card";
import { CardGrid } from "@/components/ui/card-grid";
import { SlotTime } from "@/components/schedule/slot-time";
import { CmsImage } from "@/components/ui/cms-image";
import { ContactButtons } from "@/components/ui/contact-buttons";
import { SectionTitle } from "@/components/ui/page-header";
import { BrandMark } from "@/components/layout/brand-mark";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage(await getLocale(), "home");
  return page
    ? { title: { absolute: page.seoTitle || page.title }, description: page.metaDescription }
    : {};
}

export default async function HomePage() {
  const locale = await getLocale();
  const [settings, schedule, profiles, t] = await Promise.all([
    getSettings(locale),
    getSchedule(locale, { days: 1 }),
    getProfiles(locale),
    getTranslations(),
  ]);
  const today = schedule.days[0];
  const working = today?.slots.filter((s) => s.status === "scheduled") ?? [];
  const featured = profiles.slice(0, 4);
  const [mainBanner, ...moreBanners] = settings.heroBanners;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-night">
        {mainBanner && (
          <CmsImage
            asset={mainBanner}
            sizes="100vw"
            priority
            className="absolute inset-0 size-full object-cover opacity-70"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/40 to-transparent" />
        <div className="relative mx-auto flex min-h-[70svh] max-w-6xl flex-col items-center justify-end px-4 pb-14 pt-24 text-center md:min-h-[560px]">
          <div className="rounded-3xl bg-surface/90 px-6 py-5 shadow-2xl shadow-primary/30 backdrop-blur">
            <h1 className="sr-only">{settings.siteTitle}</h1>
            <BrandMark title={settings.siteTitle} size="lg" />
          </div>
          <p className="mt-5 max-w-xl text-base font-medium text-white drop-shadow md:text-lg">
            {settings.tagline}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/schedule"
              className="bg-brand-gradient rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/40 transition-transform hover:-translate-y-0.5"
            >
              {t("home.todaySchedule")}
            </Link>
            <Link
              href="/cast"
              className="rounded-full border-2 border-white/80 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-primary"
            >
              {t("nav.cast.sub")}
            </Link>
          </div>
        </div>
      </section>

      {moreBanners.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
            {moreBanners.map((banner) => (
              <li key={banner.url} className="w-[85%] shrink-0 snap-center md:w-[calc(50%-0.375rem)]">
                <CmsImage
                  asset={banner}
                  sizes="(min-width: 768px) 560px, 85vw"
                  className="aspect-[16/9] w-full rounded-2xl border border-border object-cover"
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Intro */}
      {settings.homeIntro && (
        <section className="mx-auto max-w-3xl px-4 pt-12 text-center">
          <p className="leading-relaxed text-ink/85">{settings.homeIntro}</p>
        </section>
      )}

      {/* Today's schedule teaser */}
      <section className="mx-auto max-w-6xl px-4 pt-14">
        <SectionTitle eyebrow="TODAY" title={t("home.todaySchedule")} />
        {working.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-surface py-10 text-center text-sm text-muted">
            {t("schedule.empty")}
          </p>
        ) : (
          <CardGrid>
            {working.slice(0, 10).map((slot) => (
              <li key={slot.id}>
                <ProfileCard profile={slot.profile} footer={<SlotTime slot={slot} compact />} />
              </li>
            ))}
          </CardGrid>
        )}
        <div className="mt-6 text-center">
          <Link href="/schedule" className="text-sm font-bold text-primary hover:underline">
            {t("home.seeFullSchedule")} →
          </Link>
        </div>
      </section>

      {/* Highlights */}
      {settings.highlights.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-16">
          <SectionTitle eyebrow="CONCEPT" title={t("home.highlights")} />
          <ul className="grid gap-4 md:grid-cols-3">
            {settings.highlights.map((h, i) => (
              <li key={h.title} className="bg-blush rounded-2xl border border-border bg-surface p-6">
                <span className="font-display text-3xl font-bold text-primary-soft">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-bold text-primary">{h.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{h.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Featured cast */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-16">
          <SectionTitle eyebrow="CAST" title={t("home.newFaces")} />
          <CardGrid>
            {featured.map((p) => (
              <li key={p.id}>
                <ProfileCard profile={p} />
              </li>
            ))}
          </CardGrid>
          <div className="mt-6 text-center">
            <Link href="/cast" className="text-sm font-bold text-primary hover:underline">
              {t("home.seeAllCast")} →
            </Link>
          </div>
        </section>
      )}

      {/* Contact CTA */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <div className="bg-brand-gradient rounded-3xl p-1">
          <div className="rounded-[1.3rem] bg-surface px-6 py-10 text-center">
            <h2 className="text-brand-gradient font-display text-2xl font-bold md:text-3xl">
              {t("home.ctaTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-muted">{t("home.ctaBody")}</p>
            <ContactButtons channels={settings.contactChannels} className="mt-6" />
          </div>
        </div>
      </section>
    </>
  );
}
