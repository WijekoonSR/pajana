"use client";

import { useTranslations } from "next-intl";
import { useId, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import type { CastStyleOption } from "@/lib/api/types";
import {
  AGE_PRESETS,
  AVAILABILITY,
  HEIGHT_PRESETS,
  castQuery,
  type CastFilterValues,
  type RangePreset,
} from "@/lib/cast-filters";

/** Age, height, style and availability dropdowns; every change resets to page 1. */
export function CastFilters({
  values,
  styles,
}: {
  values: CastFilterValues;
  styles: CastStyleOption[];
}) {
  const t = useTranslations("cast.filters");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const active = Object.values(values).some(Boolean);

  const apply = (next: CastFilterValues) =>
    startTransition(() => {
      router.replace({ pathname: "/cast", query: castQuery(next) }, { scroll: false });
    });
  const set = (key: keyof CastFilterValues) => (value: string) =>
    apply({ ...values, [key]: value || undefined });

  const ageLabel = (p: RangePreset) =>
    p.max === undefined ? t("ageOver", { min: p.min! }) : t("ageRange", { min: p.min!, max: p.max });
  const heightLabel = (p: RangePreset) =>
    p.min === undefined
      ? t("heightUnder", { max: p.max! + 1 })
      : p.max === undefined
        ? t("heightOver", { min: p.min })
        : t("heightRange", { min: p.min, max: p.max });

  return (
    <div
      role="search"
      aria-busy={pending}
      className={`rounded-2xl border border-border bg-surface p-3 transition-opacity md:p-4 ${pending ? "opacity-60" : ""}`}
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <FilterSelect label={t("age")} value={values.age} onChange={set("age")} anyLabel={t("any")}>
          {AGE_PRESETS.map((p) => (
            <option key={p.key} value={p.key}>
              {ageLabel(p)}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label={t("height")} value={values.height} onChange={set("height")} anyLabel={t("any")}>
          {HEIGHT_PRESETS.map((p) => (
            <option key={p.key} value={p.key}>
              {heightLabel(p)}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label={t("style")} value={values.style} onChange={set("style")} anyLabel={t("any")}>
          {styles.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label={t("availability")}
          value={values.available}
          onChange={set("available")}
          anyLabel={t("anyTime")}
        >
          {AVAILABILITY.map((a) => (
            <option key={a} value={a}>
              {t(a)}
            </option>
          ))}
        </FilterSelect>
      </div>
      {active && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => apply({})}
            className="text-xs font-bold text-primary hover:underline"
          >
            {t("clear")}
          </button>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  anyLabel,
  children,
}: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  anyLabel: string;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-[11px] font-bold tracking-wider text-muted">
        {label}
      </label>
      <select
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`h-10 w-full min-w-0 truncate rounded-xl border bg-surface px-3 text-sm outline-none transition-colors focus:border-primary ${
          value ? "border-primary-soft font-bold text-primary" : "border-border text-ink"
        }`}
      >
        <option value="">{anyLabel}</option>
        {children}
      </select>
    </div>
  );
}
