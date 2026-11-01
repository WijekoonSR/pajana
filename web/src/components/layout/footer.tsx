import { getTranslations } from "next-intl/server";
import { cacheLife } from "next/cache";
import { Link } from "@/i18n/navigation";
import type { SiteSettings } from "@/lib/api/types";
import { visibleNav } from "@/lib/nav";
import { ChannelIcon, ClockIcon, MapPinIcon } from "@/components/ui/icons";
import { BrandMark } from "./brand-mark";

async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function Footer({ settings }: { settings: SiteSettings }) {
  const t = await getTranslations();
  const nav = visibleNav(settings.navigation);
  const year = await currentYear();

  return (
    <footer className="mt-16 bg-night text-night-ink">
      <div className="h-1 bg-brand-gradient" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.3fr_1fr_1fr]">
        <div className="space-y-4">
          <BrandMark title={settings.siteTitle} tagline={settings.tagline} tone="dark" />
          <ul className="space-y-2 text-sm text-night-ink/80">
            <li className="flex items-start gap-2">
              <ClockIcon className="mt-0.5 shrink-0 text-primary-soft" />
              {settings.businessHours}
            </li>
            <li className="flex items-start gap-2">
              <MapPinIcon className="mt-0.5 shrink-0 text-primary-soft" />
              {settings.serviceArea}
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 font-display text-sm font-bold tracking-[0.2em] text-primary-soft">
            {t("footer.contact").toUpperCase()}
          </h2>
          <ul className="space-y-2.5 text-sm">
            {settings.contactChannels.map((c) => (
              <li key={`${c.type}-${c.value}`}>
                <a
                  href={c.href}
                  className="inline-flex items-center gap-2 text-night-ink/85 hover:text-primary-soft"
                >
                  <ChannelIcon type={c.type} width={15} height={15} />
                  <span className="text-night-ink/60">{c.label}</span>
                  {c.value}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="mb-4 font-display text-sm font-bold tracking-[0.2em] text-primary-soft">
              {t("footer.menu").toUpperCase()}
            </h2>
            <ul className="space-y-2 text-sm">
              {nav.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className="text-night-ink/85 hover:text-primary-soft">
                    {t(`nav.${item.key}.sub`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-4 font-display text-sm font-bold tracking-[0.2em] text-primary-soft">
              {t("footer.legal").toUpperCase()}
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-night-ink/85 hover:text-primary-soft">
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-night-ink/85 hover:text-primary-soft">
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link href="/notices" className="text-night-ink/85 hover:text-primary-soft">
                  {t("footer.notices")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 text-xs text-night-ink/60 md:flex-row md:justify-between">
          <p>
            <span className="mr-1.5 rounded bg-primary px-1.5 py-0.5 font-bold text-white">18+</span>
            {t("footer.adultsOnly")}
          </p>
          <p>{t("footer.rights", { year, site: settings.siteTitle })}</p>
        </div>
      </div>
    </footer>
  );
}
