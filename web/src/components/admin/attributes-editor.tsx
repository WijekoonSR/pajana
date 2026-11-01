"use client";

import { useState } from "react";
import { ADMIN_LOCALES, LOCALE_SHORT, type Localized, type ProfileAttribute } from "@/lib/admin/types";
import { btn, input, label } from "./styles";

const empty = (): Localized => ({ en: "", "zh-TW": "", "zh-CN": "" });

const PRESETS: { label: Localized }[] = [
  { label: { en: "Age", "zh-TW": "年齡", "zh-CN": "年龄" } },
  { label: { en: "Height", "zh-TW": "身高", "zh-CN": "身高" } },
  { label: { en: "Style", "zh-TW": "風格", "zh-CN": "风格" } },
];

/** Public attributes (label + value per locale), posted as JSON in "attributes". */
export function AttributesEditor({ initial }: { initial: ProfileAttribute[] }) {
  const [rows, setRows] = useState(initial);
  const set = (i: number, part: "label" | "value", l: keyof Localized, v: string) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, [part]: { ...row[part], [l]: v } } : row)));

  return (
    <fieldset>
      <legend className={label}>Public attributes</legend>
      <input type="hidden" name="attributes" value={JSON.stringify(rows)} />
      <p className="mb-3 text-xs text-muted">
        Optional details shown on the card and profile page. Do not enter legal names, birthdates or
        other personal data.
      </p>
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="rounded-xl border border-border/70 bg-surface-2/30 p-3">
            <div className="grid gap-2 md:grid-cols-3">
              {ADMIN_LOCALES.map((l) => (
                <div key={l} className="grid grid-cols-[2.5rem_1fr_1fr] items-center gap-2">
                  <span className="text-[11px] font-semibold text-primary">{LOCALE_SHORT[l]}</span>
                  <input
                    aria-label={`Attribute ${i + 1} label (${LOCALE_SHORT[l]})`}
                    placeholder="Label"
                    value={row.label[l]}
                    onChange={(e) => set(i, "label", l, e.target.value)}
                    className={input}
                  />
                  <input
                    aria-label={`Attribute ${i + 1} value (${LOCALE_SHORT[l]})`}
                    placeholder="Value"
                    value={row.value[l]}
                    onChange={(e) => set(i, "value", l, e.target.value)}
                    className={input}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => setRows((r) => { const n = [...r]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })}
                className={btn.small}
              >
                Move up
              </button>
              <button
                type="button"
                onClick={() => setRows((r) => r.filter((_, j) => j !== i))}
                className={btn.smallDanger}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => setRows((r) => [...r, { label: empty(), value: empty() }])} className={btn.small}>
          + Add attribute
        </button>
        {PRESETS.filter((p) => !rows.some((r) => r.label.en === p.label.en)).map((p) => (
          <button
            key={p.label.en}
            type="button"
            onClick={() => setRows((r) => [...r, { label: { ...p.label }, value: empty() }])}
            className={btn.ghost}
          >
            + {p.label.en}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
