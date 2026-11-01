import type { CastAvailability } from "@/lib/api/types";

/** Range presets, encoded in the URL as "min-max", "min-" or "-max". */
export interface RangePreset {
  key: string;
  min?: number;
  max?: number;
}

export const AGE_PRESETS: RangePreset[] = [
  { key: "18-21", min: 18, max: 21 },
  { key: "22-24", min: 22, max: 24 },
  { key: "25-27", min: 25, max: 27 },
  { key: "28-", min: 28 },
];

export const HEIGHT_PRESETS: RangePreset[] = [
  { key: "-154", max: 154 },
  { key: "155-159", min: 155, max: 159 },
  { key: "160-164", min: 160, max: 164 },
  { key: "165-", min: 165 },
];

export const AVAILABILITY: CastAvailability[] = ["now", "today", "week"];

export const CAST_PAGE_SIZE = 12;

export interface CastFilterValues {
  age?: string;
  height?: string;
  style?: string;
  available?: CastAvailability;
}

type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Reads filters from the URL, dropping anything that is not a known value. */
export function parseCastSearch(sp: SearchParams) {
  const age = first(sp.age);
  const height = first(sp.height);
  const style = first(sp.style)?.trim().toLowerCase().slice(0, 60);
  const available = first(sp.available);
  const page = Number(first(sp.page));
  const filters: CastFilterValues = {
    age: AGE_PRESETS.some((p) => p.key === age) ? age : undefined,
    height: HEIGHT_PRESETS.some((p) => p.key === height) ? height : undefined,
    style: style || undefined,
    available: AVAILABILITY.find((a) => a === available),
  };
  return { filters, page: Number.isInteger(page) && page > 1 ? page : 1 };
}

export function presetRange(presets: RangePreset[], key: string | undefined) {
  return presets.find((p) => p.key === key);
}

/** URL query for the cast page; empty values are left out. */
export function castQuery(filters: CastFilterValues, page = 1) {
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(filters)) if (v) query[k] = v;
  if (page > 1) query.page = String(page);
  return query;
}
