import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { getPage, getSettings } from "@/lib/api/client";
import { findChannel } from "@/lib/contact";
import { cmsPageMetadata } from "@/lib/page-meta";
import { ClockIcon, MapPinIcon, PhoneIcon } from "@/components/ui/icons";
import { Markdown } from "@/components/ui/markdown";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("access");
  return cmsPageMetadata("access", t("title"));
}

export default async function AccessPage() {
  const locale = await getLocale();
  const [settings, page, t] = await Promise.all([
    getSettings(locale),
    getPage(locale, "access"),
    getTranslations("access"),
  ]);
  const phone = findChannel(settings.contactChannels, "phone");

  return (
    <>
      <PageHeader eyebrow="ACCESS" title={page?.title ?? t("title")} />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <dl className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          <InfoRow icon={<MapPinIcon />} label={t("area")}>
            {settings.serviceArea}
            {/* Map link only when approved and configured (SRS WEB-06). */}
            {settings.mapUrl && (
              <a
                href={settings.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-xs font-bold text-primary underline"
              >
                {t("map")}
              </a>
            )}
          </InfoRow>
          <InfoRow icon={<ClockIcon />} label={t("hours")}>
            {settings.businessHours}
          </InfoRow>
          {phone && (
            <InfoRow icon={<PhoneIcon />} label={t("phone")}>
              <a href={phone.href} className="font-bold text-primary hover:underline">
                {phone.value}
              </a>
            </InfoRow>
          )}
        </dl>
        {page?.body && (
          <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
            <Markdown>{page.body}</Markdown>
          </div>
        )}
      </div>
    </>
  );
}

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="flex items-center gap-2 text-sm font-bold text-primary">
        {icon}
        {label}
      </dt>
      <dd className="text-sm text-ink">{children}</dd>
    </div>
  );
}
