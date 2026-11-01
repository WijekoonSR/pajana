import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Suspense, type ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { getSchedule } from "@/lib/api/client";
import type { ScheduleResponse, ScheduleSlot } from "@/lib/api/types";
import { addDays, isIsoDate, isWeekend, tokyoDate } from "@/lib/dates";
import { ProfileCard } from "@/components/cast/profile-card";
import { CardGrid } from "@/components/ui/card-grid";
import { SlotTime } from "@/components/schedule/slot-time";
import { CmsImage } from "@/components/ui/cms-image";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";

type Mode = "daily" | "weekly";

/** Cast rows per page in the weekly table. */
const WEEKLY_PAGE_SIZE = 10;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("schedule");
  return { title: t("title") };
}

export default async function SchedulePage({ searchParams }: PageProps<"/[locale]/schedule">) {
  const t = await getTranslations("schedule");
  return (
    <>
      <PageHeader eyebrow="SCHEDULE" title={t("title")} lead={t("lead")} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Suspense fallback={<ScheduleSkeleton />}>
          <ScheduleView searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function ScheduleView({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/schedule">["searchParams"];
}) {
  const sp = await searchParams;
  const mode: Mode = sp.mode === "weekly" ? "weekly" : "daily";
  const date = isIsoDate(sp.date) ? sp.date : undefined;
  const page = Math.max(1, Number.parseInt(String(sp.page ?? "1"), 10) || 1);

  const locale = await getLocale();
  const [schedule, t, format] = await Promise.all([
    getSchedule(locale, { date, days: mode === "weekly" ? 7 : 1 }),
    getTranslations("schedule"),
    getFormatter(),
  ]);
  const current = schedule.days[0]?.date ?? schedule.today;
  const step = mode === "weekly" ? 7 : 1;
  const href = (m: Mode, d: string) => ({ pathname: "/schedule", query: { mode: m, date: d } });

  return (
    <div className="space-y-6">
      {/* Mode tabs */}
      <div role="tablist" className="mx-auto flex w-fit rounded-full border border-border bg-surface p-1">
        {(["daily", "weekly"] as const).map((m) => (
          <Link
            key={m}
            role="tab"
            aria-selected={m === mode}
            href={href(m, current)}
            className={`rounded-full px-6 py-2 text-sm font-bold transition-colors ${
              m === mode ? "bg-primary text-white shadow" : "text-muted hover:text-primary"
            }`}
          >
            {t(m)}
          </Link>
        ))}
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-surface p-2">
        <Link
          href={href(mode, addDays(current, -step))}
          className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-primary"
        >
          <ChevronLeftIcon width={16} height={16} />
          <span className="hidden sm:inline">{mode === "weekly" ? t("prevWeek") : t("prevDay")}</span>
        </Link>
        <div className="flex min-w-0 flex-col items-center text-center">
          <p className="truncate font-display text-lg font-bold text-ink md:text-xl">
            {mode === "weekly"
              ? format.dateTimeRange(tokyoDate(current), tokyoDate(addDays(current, 6)), {
                  month: "short",
                  day: "numeric",
                })
              : format.dateTime(tokyoDate(current), {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                })}
          </p>
          {current !== schedule.today && (
            <Link href={href(mode, schedule.today)} className="text-xs font-bold text-primary hover:underline">
              {t("today")}
            </Link>
          )}
          {current === schedule.today && (
            <span className="bg-brand-gradient mt-0.5 rounded-full px-2 py-px text-[10px] font-bold text-white">
              {t("today")}
            </span>
          )}
        </div>
        <Link
          href={href(mode, addDays(current, step))}
          className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-primary"
        >
          <span className="hidden sm:inline">{mode === "weekly" ? t("nextWeek") : t("nextDay")}</span>
          <ChevronRightIcon width={16} height={16} />
        </Link>
      </div>

      {mode === "daily" ? (
        <DailyView schedule={schedule} />
      ) : (
        <WeeklyView
          schedule={schedule}
          page={page}
          href={(p) => ({ pathname: "/schedule", query: { mode, date: current, page: p } })}
        />
      )}
    </div>
  );
}

async function DailyView({ schedule }: { schedule: ScheduleResponse }) {
  const t = await getTranslations("schedule");
  const working = schedule.days[0]?.slots.filter((s) => s.status === "scheduled") ?? [];

  if (working.length === 0) return <EmptyState message={t("empty")} />;

  return (
    <>
      <p className="text-center text-sm text-muted">{t("working", { count: working.length })}</p>
      <CardGrid>
        {working.map((slot, i) => (
          <li key={slot.id}>
            <ProfileCard
              profile={slot.profile}
              priority={i < 4}
              footer={
                <div className="space-y-1">
                  <SlotTime slot={slot} compact />
                  {/* Always one line (even when empty) so all cards match in height. */}
                  <p className="truncate text-[11px] text-muted">{slot.note || "\u00a0"}</p>
                </div>
              }
            />
          </li>
        ))}
      </CardGrid>
    </>
  );
}

/** Profiles x days matrix; scrolls horizontally on phones with a sticky name column. */
async function WeeklyView({
  schedule,
  page: requested,
  href,
}: {
  schedule: ScheduleResponse;
  page: number;
  href: ComponentProps<typeof Pagination>["href"];
}) {
  const [t, format] = await Promise.all([getTranslations("schedule"), getFormatter()]);

  const rows = new Map<string, { profile: ScheduleSlot["profile"]; byDate: Map<string, ScheduleSlot[]> }>();
  for (const day of schedule.days) {
    for (const slot of day.slots) {
      const row = rows.get(slot.profile.slug) ?? { profile: slot.profile, byDate: new Map() };
      row.byDate.set(day.date, [...(row.byDate.get(day.date) ?? []), slot]);
      rows.set(slot.profile.slug, row);
    }
  }

  if (rows.size === 0) return <EmptyState message={t("empty")} />;

  const pages = Math.ceil(rows.size / WEEKLY_PAGE_SIZE);
  const page = Math.min(requested, pages);
  const visible = [...rows.values()].slice((page - 1) * WEEKLY_PAGE_SIZE, page * WEEKLY_PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[760px] table-fixed border-collapse text-sm">
          <thead>
            <tr className="bg-surface-2/60">
              <th scope="col" className="sticky left-0 z-10 w-36 bg-surface-2 px-3 py-3 text-left">
                <span className="sr-only">{t("title")}</span>
              </th>
              {schedule.days.map((day) => (
                <th
                  key={day.date}
                  scope="col"
                  className={`px-2 py-3 text-center text-xs font-bold ${
                    day.date === schedule.today ? "text-primary" : isWeekend(day.date) ? "text-accent" : "text-ink"
                  }`}
                >
                  {format.dateTime(tokyoDate(day.date), { month: "numeric", day: "numeric" })}
                  <span className="block font-medium text-muted">
                    {format.dateTime(tokyoDate(day.date), { weekday: "short" })}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map(({ profile, byDate }) => (
              <tr key={profile.slug}>
                <th scope="row" className="sticky left-0 z-10 bg-surface px-3 py-2 text-left">
                  <Link href={`/cast/${profile.slug}`} className="flex items-center gap-2 hover:text-primary">
                    {profile.primaryImage && (
                      <CmsImage
                        asset={profile.primaryImage}
                        sizes="36px"
                        className="size-9 shrink-0 rounded-full border border-border object-cover"
                      />
                    )}
                    <span className="truncate font-bold">{profile.displayName}</span>
                  </Link>
                </th>
                {schedule.days.map((day) => {
                  const slots = byDate.get(day.date) ?? [];
                  return (
                    <td
                      key={day.date}
                      className={`px-1.5 py-2 text-center align-middle ${day.date === schedule.today ? "bg-surface-2/40" : ""}`}
                    >
                      {slots.length === 0 ? (
                        <span className="text-muted">-</span>
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          {slots.map((slot) => (
                            <SlotTime key={slot.id} slot={slot} compact nextDayBelow />
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={pages} href={href} />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-border bg-surface py-12 text-center text-sm text-muted">
      {message}
    </p>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden="true">
      <div className="mx-auto h-11 w-56 rounded-full bg-surface-2" />
      <div className="h-16 rounded-2xl bg-surface-2" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="aspect-[3/5] rounded-2xl bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
