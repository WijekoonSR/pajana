import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getProfile, getSettings } from "@/lib/api/client";
import { tokyoDate, isWeekend } from "@/lib/dates";
import { SlotTime } from "@/components/schedule/slot-time";
import { ProfileGallery } from "@/components/cast/profile-gallery";
import { ContactButtons } from "@/components/ui/contact-buttons";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { Markdown } from "@/components/ui/markdown";

export async function generateMetadata({ params }: PageProps<"/[locale]/cast/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getProfile(await getLocale(), slug);
  if (!profile) return {};
  return {
    title: profile.displayName,
    description: profile.comment || undefined,
    openGraph: profile.primaryImage ? { images: [profile.primaryImage.url] } : undefined,
  };
}

export default async function CastDetailPage({ params }: PageProps<"/[locale]/cast/[slug]">) {
  const { slug } = await params;
  const locale = await getLocale();
  const [profile, settings, t, format] = await Promise.all([
    getProfile(locale, slug),
    getSettings(locale),
    getTranslations(),
    getFormatter(),
  ]);
  // Unpublished / hidden profiles are a 404 (SRS WEB-05, UAT-04).
  if (!profile) notFound();

  const images = profile.gallery.length
    ? profile.gallery
    : profile.primaryImage
      ? [profile.primaryImage]
      : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <nav aria-label="Breadcrumb" className="mb-4">
        <Link href="/cast" className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary">
          <ChevronLeftIcon width={16} height={16} />
          {t("common.backTo", { page: t("nav.cast.sub") })}
        </Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-10">
        <section aria-label={t("cast.gallery")}>
          {images.length > 0 ? (
            <ProfileGallery images={images} name={profile.displayName} />
          ) : (
            <div className="grid aspect-[3/4] place-items-center rounded-3xl bg-surface-2 text-sm text-muted">
              {t("common.noImage")}
            </div>
          )}
        </section>

        <div className="space-y-6">
          <header>
            {profile.isNew && (
              <span className="bg-brand-gradient mb-2 inline-block rounded-full px-3 py-0.5 text-xs font-black tracking-wider text-white">
                {t("common.new")}
              </span>
            )}
            <h1 className="text-brand-gradient font-display text-4xl font-bold md:text-5xl">
              {profile.displayName}
            </h1>
          </header>

          {profile.attributes.length > 0 && (
            <section aria-labelledby="profile-heading" className="rounded-2xl border border-border bg-surface">
              <h2 id="profile-heading" className="sr-only">{t("cast.profile")}</h2>
              <dl className="divide-y divide-border">
                {profile.attributes.map((a) => (
                  <div key={a.label} className="grid grid-cols-[7rem_1fr] gap-3 px-5 py-3 text-sm">
                    <dt className="font-bold text-primary">{a.label}</dt>
                    <dd className="text-ink">{a.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {profile.comment && (
            <section className="bg-blush rounded-2xl border border-border p-5">
              <h2 className="mb-2 text-sm font-bold text-primary">{t("cast.message")}</h2>
              <p className="text-sm leading-relaxed text-ink/90">{profile.comment}</p>
            </section>
          )}

          {profile.bio && <Markdown>{profile.bio}</Markdown>}

          <section aria-labelledby="schedule-heading">
            <h2 id="schedule-heading" className="mb-3 font-bold text-ink">{t("cast.schedule")}</h2>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
              {profile.schedule.map((day) => {
                const slots = day.slots;
                return (
                  <li key={day.date} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <span className={isWeekend(day.date) ? "font-medium text-accent" : "text-ink"}>
                      {format.dateTime(tokyoDate(day.date), { month: "short", day: "numeric", weekday: "short" })}
                    </span>
                    <span className="flex flex-col items-end gap-0.5">
                      {slots.length === 0 ? (
                        <span className="text-xs text-muted">-</span>
                      ) : (
                        slots.map((slot) => <SlotTime key={slot.id} slot={slot} />)
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <ContactButtons channels={settings.contactChannels.slice(0, 2)} className="md:justify-start" />
        </div>
      </div>
    </div>
  );
}
