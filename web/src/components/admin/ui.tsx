import Image from "next/image";
import type { ReactNode } from "react";
import {
  ADMIN_LOCALES,
  LOCALE_SHORT,
  type Localized,
  type PageStatus,
  type SlotStatus,
  type Visibility,
} from "@/lib/admin/types";
import { card, input, label as labelClass } from "./styles";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back}
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Card({
  title,
  description,
  actions,
  children,
  className = "",
  padded = true,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={`${card} ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
          <div>
            {title && <h2 className="text-base font-bold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className = "",
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/**
 * Three inputs for one localized value (EN / 繁中 / 简中). Empty translations are
 * flagged: the public site falls back to English for them (SRS 07).
 */
export function LocalizedField({
  name,
  label,
  value,
  multiline,
  rows = 4,
  requireEnglish,
  hint,
  maxLength,
  idPrefix,
  stacked,
}: {
  /** One language per row, for narrow containers such as drawers. */
  stacked?: boolean;
  name: string;
  /** Makes element ids unique when a page has several forms with this field. */
  idPrefix?: string;
  label: string;
  value?: Partial<Localized>;
  multiline?: boolean;
  rows?: number;
  requireEnglish?: boolean;
  hint?: ReactNode;
  maxLength?: number;
}) {
  return (
    <fieldset>
      <legend className={labelClass}>
        {label}
        {requireEnglish && <span className="ml-1 normal-case text-primary">(English required)</span>}
      </legend>
      <div className={`grid gap-3 ${stacked ? "" : multiline ? "xl:grid-cols-3" : "md:grid-cols-3"}`}>
        {ADMIN_LOCALES.map((l) => {
          const id = `${idPrefix ? `${idPrefix}-` : ""}${name}.${l}`;
          const current = value?.[l] ?? "";
          const props = {
            id,
            name: `${name}.${l}`,
            defaultValue: current,
            maxLength,
            lang: l,
            required: requireEnglish && l === "en",
            className: input,
          };
          return (
            <div key={l} className="min-w-0">
              <label htmlFor={id} className="mb-1 flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold text-muted">
                <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-primary">{LOCALE_SHORT[l]}</span>
                {!current.trim() && value && (
                  <span
                    className="truncate rounded-md bg-amber-50 px-1.5 py-0.5 text-amber-700"
                    title={l === "en" ? "Empty" : "Missing: the public site shows the English text"}
                  >
                    {l === "en" ? "Empty" : "Missing, uses EN"}
                  </span>
                )}
              </label>
              {multiline ? <textarea rows={rows} {...props} /> : <input type="text" {...props} />}
            </div>
          );
        })}
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </fieldset>
  );
}

const TONES = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  pink: "bg-surface-2 text-primary ring-border",
  night: "bg-night text-night-ink ring-night",
} as const;

export function Badge({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

const VISIBILITY: Record<Visibility, [keyof typeof TONES, string]> = {
  PUBLISHED: ["green", "Published"],
  DRAFT: ["amber", "Draft"],
  HIDDEN: ["slate", "Hidden"],
  ARCHIVED: ["red", "Archived"],
};

export function VisibilityBadge({ value }: { value: Visibility }) {
  const [tone, text] = VISIBILITY[value];
  return <Badge tone={tone}>{text}</Badge>;
}

export function PageStatusBadge({ value }: { value: PageStatus | null }) {
  if (!value) return <Badge tone="slate">Not written</Badge>;
  return value === "PUBLISHED" ? <Badge tone="green">Published</Badge> : <Badge tone="amber">Draft</Badge>;
}

export function SlotStatusBadge({ value }: { value: SlotStatus }) {
  if (value === "DAY_OFF") return <Badge tone="slate">Day off</Badge>;
  if (value === "CANCELLED") return <Badge tone="red">Cancelled</Badge>;
  return <Badge tone="green">Scheduled</Badge>;
}

export function PublishedBadge({ published }: { published: boolean }) {
  return published ? <Badge tone="green">Shown</Badge> : <Badge tone="amber">Hidden</Badge>;
}

export function MissingLocales({ locales }: { locales: string[] }) {
  if (!locales.length) return null;
  return (
    <Badge tone="amber">
      Missing {locales.map((l) => LOCALE_SHORT[l as keyof typeof LOCALE_SHORT] ?? l).join(", ")}
    </Badge>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-2/40 px-6 py-10 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}

/** Image preview from the CMS uploads folder (served as-is, no optimizer). */
export function Thumb({
  src,
  alt,
  width,
  height,
  className = "",
}: {
  src: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-surface-2 text-[10px] font-semibold uppercase text-muted ${className}`}
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        No image
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      className={`bg-surface-2 object-cover ${className}`}
    />
  );
}

export function formatDateTime(iso: string | null) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tokyo",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
