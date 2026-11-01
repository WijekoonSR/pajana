"use client";

import { ADMIN_LOCALES, LOCALE_SHORT, type Localized } from "@/lib/admin/types";
import { input, label as labelClass } from "./styles";

/** Controlled three-language input for client-side editors. */
export function LocalizedControl({
  label,
  value,
  onChange,
  multiline,
  rows = 3,
  compact,
}: {
  label: string;
  value: Localized;
  onChange: (next: Localized) => void;
  multiline?: boolean;
  rows?: number;
  compact?: boolean;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className={labelClass}>{label}</legend>
      <div className={`grid gap-2 ${multiline ? "xl:grid-cols-3" : "md:grid-cols-3"}`}>
        {ADMIN_LOCALES.map((l) => {
          const common = {
            "aria-label": `${label} (${LOCALE_SHORT[l]})`,
            lang: l,
            value: value?.[l] ?? "",
            onChange: (e: { target: { value: string } }) => onChange({ ...value, [l]: e.target.value }),
            className: input,
          };
          return (
            <div key={l} className="min-w-0">
              {!compact && (
                <span className="mb-1 flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold text-muted">
                  <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-primary">{LOCALE_SHORT[l]}</span>
                  {!value?.[l]?.trim() && l !== "en" && <span className="truncate text-amber-700">uses EN</span>}
                </span>
              )}
              {multiline ? <textarea rows={rows} {...common} /> : <input {...common} placeholder={compact ? LOCALE_SHORT[l] : undefined} />}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
