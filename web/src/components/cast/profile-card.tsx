import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import type { ProfileSummary } from "@/lib/api/types";
import { CmsImage } from "@/components/ui/cms-image";

type CardProfile = Pick<ProfileSummary, "slug" | "displayName" | "primaryImage"> &
  Partial<Pick<ProfileSummary, "attributes" | "isNew">>;

export async function ProfileCard({
  profile,
  footer,
  priority,
}: {
  profile: CardProfile;
  footer?: ReactNode;
  priority?: boolean;
}) {
  const t = await getTranslations("common");
  return (
    <Link
      href={`/cast/${profile.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all hover:-translate-y-1 hover:border-primary-soft hover:shadow-lg hover:shadow-primary/10"
    >
      <div className="relative aspect-[3/4] shrink-0 overflow-hidden bg-surface-2">
        {profile.primaryImage ? (
          <CmsImage
            asset={profile.primaryImage}
            sizes="(min-width: 1024px) 240px, (min-width: 768px) 30vw, 45vw"
            priority={priority}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-xs text-muted">{t("noImage")}</div>
        )}
        {profile.isNew && (
          <span className="bg-brand-gradient absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wider text-white shadow">
            {t("new")}
          </span>
        )}
      </div>
      {/* flex-1: cards in a row share one height whatever text they carry. */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="truncate font-bold text-ink group-hover:text-primary">{profile.displayName}</h3>
        {profile.attributes && profile.attributes.length > 0 && (
          <dl className="flex gap-x-2.5 overflow-hidden whitespace-nowrap text-[11px] text-muted">
            {profile.attributes.slice(0, 3).map((a) => (
              <div key={a.label} className="flex gap-1">
                <dt className="sr-only">{a.label}</dt>
                <dd>{a.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {footer}
      </div>
    </Link>
  );
}
