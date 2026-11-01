import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { getCast } from "@/lib/api/client";
import { AGE_PRESETS, CAST_PAGE_SIZE, HEIGHT_PRESETS, castQuery, parseCastSearch, presetRange } from "@/lib/cast-filters";
import { CastFilters } from "@/components/cast/cast-filters";
import { Pagination } from "@/components/ui/pagination";
import { ProfileCard } from "@/components/cast/profile-card";
import { CardGrid } from "@/components/ui/card-grid";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cast");
  return { title: t("title") };
}

export default async function CastPage({ searchParams }: PageProps<"/[locale]/cast">) {
  const t = await getTranslations("cast");
  return (
    <>
      <PageHeader eyebrow="CAST" title={t("title")} lead={t("lead")} />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Suspense fallback={<CastSkeleton />}>
          <CastView searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function CastView({ searchParams }: { searchParams: PageProps<"/[locale]/cast">["searchParams"] }) {
  const { filters, page } = parseCastSearch(await searchParams);
  const age = presetRange(AGE_PRESETS, filters.age);
  const height = presetRange(HEIGHT_PRESETS, filters.height);

  const locale = await getLocale();
  const [cast, t] = await Promise.all([
    getCast(locale, {
      page,
      pageSize: CAST_PAGE_SIZE,
      ageMin: age?.min,
      ageMax: age?.max,
      heightMin: height?.min,
      heightMax: height?.max,
      style: filters.style,
      available: filters.available,
    }),
    getTranslations("cast"),
  ]);
  const filtered = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-6">
      <CastFilters values={filters} styles={cast.styles} />
      {cast.total === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface py-10 text-center text-sm text-muted">
          {filtered ? t("noMatch") : t("empty")}
        </p>
      ) : (
        <>
          <p className="text-center text-sm text-muted" aria-live="polite">
            {t("count", { count: cast.total })}
          </p>
          <CardGrid>
            {cast.items.map((profile, i) => (
              <li key={profile.id}>
                <ProfileCard profile={profile} priority={i < 4} />
              </li>
            ))}
          </CardGrid>
          <Pagination
            page={cast.page}
            pages={cast.pages}
            href={(p) => ({ pathname: "/cast", query: castQuery(filters, p) })}
          />
        </>
      )}
    </div>
  );
}

function CastSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden="true">
      <div className="h-20 rounded-2xl bg-surface-2" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="aspect-[3/5] rounded-2xl bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
