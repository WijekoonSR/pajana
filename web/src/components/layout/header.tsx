import { getTranslations } from "next-intl/server";
import type { SiteSettings } from "@/lib/api/types";
import { findChannel } from "@/lib/contact";
import { visibleNav } from "@/lib/nav";
import { MessageIcon, PhoneIcon } from "@/components/ui/icons";
import { BrandMark } from "./brand-mark";
import { LanguageSwitcher } from "./language-switcher";
import { MobileMenu } from "./mobile-menu";
import { NavLink } from "./nav-link";

export async function Header({ settings }: { settings: SiteSettings }) {
  const t = await getTranslations();
  const nav = visibleNav(settings.navigation);
  const phone = findChannel(settings.contactChannels, "phone");
  const sms = findChannel(settings.contactChannels, "sms");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <BrandMark title={settings.siteTitle} tagline={settings.tagline} />

        <div className="flex shrink-0 items-center gap-2">
          {phone && (
            <a
              href={phone.href}
              className="hidden items-center gap-1.5 rounded-full border border-primary/30 px-3 py-1.5 text-sm font-bold text-primary transition-colors hover:bg-surface-2 lg:inline-flex"
            >
              <PhoneIcon width={15} height={15} />
              {phone.value}
            </a>
          )}
          {sms && (
            <a
              href={sms.href}
              className="hidden items-center gap-1.5 rounded-full border border-primary/30 px-3 py-1.5 text-sm font-bold text-primary transition-colors hover:bg-surface-2 lg:inline-flex"
            >
              <MessageIcon width={15} height={15} />
              {t("common.sms")}
            </a>
          )}
          <LanguageSwitcher />
          <MobileMenu
            items={nav.map((item) => ({
              ...item,
              title: t(`nav.${item.key}.title`),
              sub: t(`nav.${item.key}.sub`),
            }))}
          />
        </div>
      </div>

      <nav
        aria-label={t("nav.mainNav")}
        className="mx-auto hidden max-w-6xl px-4 pb-2 md:block"
      >
        <ul className="flex items-stretch justify-center gap-1">
          {nav.map((item) => (
            <li key={item.key}>
              <NavLink
                href={item.href}
                className="group flex min-w-24 flex-col items-center rounded-xl px-3 py-1.5 leading-tight transition-colors hover:bg-surface-2"
                activeClassName="bg-surface-2"
              >
                <span className="font-display text-sm font-bold tracking-[0.18em] text-ink group-hover:text-primary group-aria-[current=page]:text-primary">
                  {t(`nav.${item.key}.title`)}
                </span>
                <span className="mt-0.5 text-[11px] text-muted">
                  {t(`nav.${item.key}.sub`)}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
