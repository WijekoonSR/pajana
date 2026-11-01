import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { adminFetch, mediaUrl } from "@/lib/admin/api";
import { deleteSlot, saveSlot } from "@/lib/admin/actions/schedule";
import type { ProfileRow, ScheduleRange, Slot } from "@/lib/admin/types";
import { ActionButton, ActionForm, SubmitButton } from "@/components/admin/action-form";
import { ChevronLeft, ChevronRight, MoonIcon, PlusIcon } from "@/components/admin/icons";
import { SlotTimes } from "@/components/admin/slot-times";
import { btn, input } from "@/components/admin/styles";
import {
  Card,
  EmptyState,
  Field,
  LocalizedField,
  PageHeader,
  SlotStatusBadge,
  Thumb,
  VisibilityBadge,
} from "@/components/admin/ui";

export const metadata: Metadata = { title: "Schedule" };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function addMonths(month: string, delta: number) {
  const d = new Date(`${month}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 7);
}

/** Monday-first weeks covering the whole month. */
function monthGrid(month: string) {
  const first = `${month}-01`;
  const weekday = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  const start = addDays(first, -weekday);
  const end = addDays(addMonths(month, 1) + "-01", -1);
  const days: string[] = [];
  for (let d = start; d <= end || days.length % 7 !== 0; d = addDays(d, 1)) days.push(d);
  return days;
}

/** Today's date in Asia/Tokyo (UTC+9, no daylight saving). */
function tokyoToday() {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
}

const fmt = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });

const CHIP = {
  SCHEDULED: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-400",
  DAY_OFF: "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-400",
  CANCELLED: "border-red-200 bg-red-50 text-red-700 line-through hover:border-red-400",
};

export default async function SchedulePage({ searchParams }: PageProps<"/admin/schedule">) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const profiles = await adminFetch<ProfileRow[]>("/profiles/options");
  // Read after the request data above, so this page always renders per request.
  const today = tokyoToday();

  const view = str("view") === "day" ? "day" : "cast";
  const q = str("q").trim().toLowerCase();
  const castId = str("cast");
  const month = MONTH_RE.test(str("month")) ? str("month") : today.slice(0, 7);
  const day = DATE_RE.test(str("day")) ? str("day") : today;

  const active = profiles.filter((p) => p.visibility !== "ARCHIVED");
  const cast = active.find((p) => p.id === castId);
  const listed = active.filter(
    (p) => !q || p.slug.includes(q) || Object.values(p.displayName).some((n) => n.toLowerCase().includes(q)),
  );

  // Load only what is on screen: one cast's month, or one day for everyone.
  const grid = cast ? monthGrid(month) : [];
  const range =
    view === "day"
      ? await adminFetch<ScheduleRange>(`/schedule?from=${day}&days=1`)
      : cast
        ? await adminFetch<ScheduleRange>(`/schedule?from=${grid[0]}&days=${grid.length}&profileId=${cast.id}`)
        : null;
  const slots = range?.slots ?? [];

  const editing = str("edit") ? slots.find((s) => s.id === str("edit")) : undefined;
  const adding = typeof sp.add === "string";
  const addDate = adding && DATE_RE.test(str("add")) ? str("add") : view === "day" ? day : today;

  const base = new URLSearchParams();
  if (view === "day") {
    base.set("view", "day");
    base.set("day", day);
  } else {
    if (q) base.set("q", q);
    if (cast) base.set("cast", cast.id);
    if (cast) base.set("month", month);
  }
  const href = (patch: Record<string, string | null> = {}) => {
    const next = new URLSearchParams(base);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    return qs ? `/admin/schedule?${qs}` : "/admin/schedule";
  };

  return (
    <>
      <PageHeader
        title="Schedule"
        description="Shifts in Japan time. Cancelled slots and unpublished profiles never appear publicly."
        actions={
          (cast || view === "day") && (
            <Link href={href({ add: addDate })} scroll={false} className={btn.primary}>
              <PlusIcon /> Add slot
            </Link>
          )
        }
      />

      <div role="tablist" aria-label="View" className="mb-4 inline-flex rounded-full bg-white p-1 text-sm font-semibold ring-1 ring-border">
        <Link
          role="tab"
          aria-selected={view === "cast"}
          href="/admin/schedule"
          className={`rounded-full px-4 py-1.5 ${view === "cast" ? "bg-ink text-white" : "text-muted hover:text-primary"}`}
        >
          By cast
        </Link>
        <Link
          role="tab"
          aria-selected={view === "day"}
          href={`/admin/schedule?view=day&day=${today}`}
          className={`rounded-full px-4 py-1.5 ${view === "day" ? "bg-ink text-white" : "text-muted hover:text-primary"}`}
        >
          Day overview
        </Link>
      </div>

      {view === "cast" ? (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <CastList casts={listed} total={active.length} q={q} selected={cast?.id} month={cast ? month : today.slice(0, 7)} />
          {cast ? (
            <MonthCalendar
              cast={cast}
              month={month}
              grid={grid}
              today={today}
              slots={slots}
              editingId={editing?.id}
              prevHref={href({ month: addMonths(month, -1) })}
              nextHref={href({ month: addMonths(month, 1) })}
              todayHref={href({ month: today.slice(0, 7) })}
              slotHref={(id) => href({ edit: id })}
              addHref={(d) => href({ add: d })}
            />
          ) : (
            <EmptyState title="Select a cast to see their calendar">
              Pick someone from the list. Use <strong>Day overview</strong> to see everyone working on one day.
            </EmptyState>
          )}
        </div>
      ) : (
        <DayOverview
          day={day}
          today={today}
          slots={slots}
          prevHref={`/admin/schedule?view=day&day=${addDays(day, -1)}`}
          nextHref={`/admin/schedule?view=day&day=${addDays(day, 1)}`}
          slotHref={(id) => href({ edit: id })}
        />
      )}

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded border border-emerald-300 bg-emerald-50" /> Scheduled</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded border border-slate-300 bg-slate-50" /> Day off (shown publicly as day off)</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded border border-red-300 bg-red-50" /> Cancelled (not public)</span>
        <span className="inline-flex items-center gap-1"><MoonIcon width={12} height={12} /> Ends next day</span>
      </div>

      {(adding || editing) && (
        <Drawer closeHref={href()} title={editing ? "Edit slot" : "Add slot"}>
          <SlotForm
            key={editing?.id ?? `${cast?.id}-${addDate}`}
            slot={editing}
            profiles={active}
            defaultProfile={cast?.id}
            defaultDate={addDate}
          />
        </Drawer>
      )}
    </>
  );
}

function CastList({
  casts,
  total,
  q,
  selected,
  month,
}: {
  casts: ProfileRow[];
  total: number;
  q: string;
  selected?: string;
  month: string;
}) {
  return (
    <Card padded={false} className="lg:sticky lg:top-6 lg:self-start">
      <form action="/admin/schedule" className="border-b border-border/60 p-3">
        <label htmlFor="cast-search" className="sr-only">Search cast</label>
        <input id="cast-search" type="search" name="q" defaultValue={q} placeholder={`Search ${total} cast…`} className={input} />
      </form>
      <ul className="max-h-[60svh] overflow-y-auto p-2">
        {casts.map((p) => {
          const active = p.id === selected;
          const params = new URLSearchParams({ cast: p.id, month });
          if (q) params.set("q", q);
          return (
            <li key={p.id}>
              <Link
                href={`/admin/schedule?${params}`}
                aria-current={active ? "true" : undefined}
                className={`flex items-center gap-3 rounded-xl px-2 py-2 text-sm transition ${
                  active ? "bg-primary text-white" : "text-ink hover:bg-surface-2"
                }`}
              >
                <Thumb
                  src={p.thumbnail ? mediaUrl(p.thumbnail) : null}
                  alt=""
                  width={32}
                  height={40}
                  className="h-10 w-8 shrink-0 rounded-md"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{p.displayName.en || p.slug}</span>
                  <span className={`block truncate text-[11px] ${active ? "text-white/80" : "text-muted"}`}>
                    {p.visibility === "PUBLISHED" ? `${p.slotCount} slots` : `${p.visibility.toLowerCase()}, not public`}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
        {casts.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No cast match.</li>}
      </ul>
    </Card>
  );
}

function MonthCalendar({
  cast,
  month,
  grid,
  today,
  slots,
  editingId,
  prevHref,
  nextHref,
  todayHref,
  slotHref,
  addHref,
}: {
  cast: ProfileRow;
  month: string;
  grid: string[];
  today: string;
  slots: Slot[];
  editingId?: string;
  prevHref: string;
  nextHref: string;
  todayHref: string;
  slotHref: (id: string) => string;
  addHref: (date: string) => string;
}) {
  const inMonth = slots.filter((s) => s.date.startsWith(month) && s.status === "SCHEDULED");
  return (
    <Card
      padded={false}
      title={
        <span className="flex flex-wrap items-center gap-2">
          {cast.displayName.en || cast.slug}
          <VisibilityBadge value={cast.visibility} />
        </span>
      }
      description={`${fmt(`${month}-01`, { month: "long", year: "numeric" })} · ${inMonth.length} shifts this month`}
      actions={
        <>
          <Link href={prevHref} className={btn.icon} aria-label="Previous month"><ChevronLeft width={16} height={16} /></Link>
          <Link href={todayHref} className={btn.small}>This month</Link>
          <Link href={nextHref} className={btn.icon} aria-label="Next month"><ChevronRight width={16} height={16} /></Link>
        </>
      }
    >
      <div className="overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-7 text-sm">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="border-b border-border/60 bg-surface-2/40 px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
              {d}
            </div>
          ))}
          {grid.map((d) => {
            const daySlots = slots.filter((s) => s.date === d);
            const outside = !d.startsWith(month);
            const isToday = d === today;
            return (
              <div
                key={d}
                className={`group min-h-24 border-b border-r border-border/40 p-1.5 ${outside ? "bg-surface-2/20" : "bg-white"}`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-bold ${
                      isToday ? "bg-primary text-white" : outside ? "text-muted/50" : "text-ink"
                    }`}
                  >
                    {Number(d.slice(8))}
                  </span>
                  <Link
                    href={addHref(d)}
                    scroll={false}
                    aria-label={`Add slot on ${d}`}
                    className="rounded-md px-1.5 text-sm text-muted/0 transition group-hover:text-muted hover:bg-surface-2 hover:text-primary! focus:text-muted"
                  >
                    +
                  </Link>
                </div>
                <div className="flex flex-col gap-1">
                  {daySlots.map((s) => (
                    <SlotChip key={s.id} slot={s} href={slotHref(s.id)} active={editingId === s.id} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function DayOverview({
  day,
  today,
  slots,
  prevHref,
  nextHref,
  slotHref,
}: {
  day: string;
  today: string;
  slots: Slot[];
  prevHref: string;
  nextHref: string;
  slotHref: (id: string) => string;
}) {
  const sorted = [...slots].sort((a, b) => a.start.localeCompare(b.start));
  const working = sorted.filter((s) => s.status === "SCHEDULED").length;
  return (
    <Card
      padded={false}
      title={fmt(day, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      description={`${working} on shift${day === today ? " · today" : ""}`}
      actions={
        <>
          <Link href={prevHref} className={btn.icon} aria-label="Previous day"><ChevronLeft width={16} height={16} /></Link>
          <form action="/admin/schedule" className="flex items-center gap-1">
            <input type="hidden" name="view" value="day" />
            <label htmlFor="day-jump" className="sr-only">Go to date</label>
            <input id="day-jump" type="date" name="day" defaultValue={day} className={`${input} w-auto! py-1!`} />
            <button type="submit" className={btn.small}>Go</button>
          </form>
          <Link href={nextHref} className={btn.icon} aria-label="Next day"><ChevronRight width={16} height={16} /></Link>
        </>
      }
    >
      <ul className="divide-y divide-border/50">
        {sorted.map((x) => (
          <li key={x.id}>
            <Link href={slotHref(x.id)} scroll={false} className="flex items-center gap-4 px-5 py-3 hover:bg-surface-2/30">
              <span className="w-32 shrink-0 whitespace-nowrap font-semibold tabular-nums text-ink">
                {x.status === "DAY_OFF" ? "-" : `${x.startTime}–${x.endTime}`}
                {x.endsNextDay && <MoonIcon width={11} height={11} className="ml-1 inline" aria-label="ends next day" />}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-ink">
                {x.profile.displayName.en || x.profile.slug}
                {x.profile.visibility !== "PUBLISHED" && (
                  <span className="ml-2 text-[10px] font-medium uppercase text-muted">{x.profile.visibility.toLowerCase()}, not public</span>
                )}
              </span>
              {x.publicNote.en && <span className="hidden truncate text-xs text-muted sm:block">{x.publicNote.en}</span>}
              <SlotStatusBadge value={x.status} />
            </Link>
          </li>
        ))}
        {sorted.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted">No slots on this day.</li>}
      </ul>
    </Card>
  );
}

function SlotChip({ slot, href, active }: { slot: Slot; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`block rounded-lg border px-1.5 py-1 text-[11px] transition ${CHIP[slot.status]} ${active ? "ring-2 ring-primary" : ""}`}
    >
      {slot.status === "DAY_OFF" ? (
        <span className="font-semibold">Day off</span>
      ) : (
        <span className="flex items-center gap-1 font-semibold tabular-nums">
          {slot.startTime}–{slot.endTime}
          {slot.endsNextDay && <MoonIcon width={10} height={10} aria-label="ends next day" />}
        </span>
      )}
      {slot.publicNote.en && <span className="mt-0.5 block truncate opacity-75">{slot.publicNote.en}</span>}
    </Link>
  );
}

/** Right-hand panel over the page, so the form is always in reach. */
function Drawer({ title, closeHref, children }: { title: string; closeHref: string; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <Link href={closeHref} scroll={false} aria-label="Close" className="absolute inset-0 bg-night/40 backdrop-blur-[1px]" />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-[#fbf6f8] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/70 bg-white px-5 py-4">
          <h2 className="text-base font-bold text-ink">{title}</h2>
          <Link href={closeHref} scroll={false} className={btn.ghost}>Close</Link>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function SlotForm({
  slot,
  profiles,
  defaultProfile,
  defaultDate,
}: {
  slot?: Slot;
  profiles: ProfileRow[];
  defaultProfile?: string;
  defaultDate: string;
}) {
  return (
    <div className="space-y-4">
      {slot && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-white p-3 text-sm ring-1 ring-border/70">
          <span className="font-semibold text-ink">{slot.profile.displayName.en} · {slot.date}</span>
          <span className="flex items-center gap-2">
            <SlotStatusBadge value={slot.status} />
            <ActionButton action={deleteSlot.bind(null, slot.id)} variant="smallDanger" confirm="Delete this slot?">
              Delete
            </ActionButton>
          </span>
        </div>
      )}
      <ActionForm action={saveSlot.bind(null, slot?.id ?? null)} resetOnSuccess={!slot} className="space-y-5">
        <div className="grid gap-4">
          <Field label="Cast" htmlFor="profileId">
            <select id="profileId" name="profileId" required defaultValue={slot?.profileId ?? defaultProfile ?? ""} className={input}>
              <option value="" disabled>Choose…</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName.en || p.slug}
                  {p.visibility !== "PUBLISHED" ? ` (${p.visibility.toLowerCase()})` : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date (start)" htmlFor="date">
            <input id="date" name="date" type="date" required defaultValue={slot?.date ?? defaultDate} className={input} />
          </Field>
          <SlotTimes start={slot?.startTime} end={slot?.endTime} />
          <Field label="Status" htmlFor="status">
            <select id="status" name="status" defaultValue={slot?.status ?? "SCHEDULED"} className={input}>
              <option value="SCHEDULED">Scheduled</option>
              <option value="DAY_OFF">Day off</option>
              <option value="CANCELLED">Cancelled (hidden)</option>
            </select>
          </Field>
        </div>
        <LocalizedField stacked name="publicNote" label="Public note (optional)" value={slot?.publicNote} maxLength={120} />
        <div className="flex justify-end">
          <SubmitButton>{slot ? "Save slot" : "Add slot"}</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}
