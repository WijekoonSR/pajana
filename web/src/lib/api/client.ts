import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type {
  ApiLocale,
  CastAvailability,
  CastResponse,
  ContentPage,
  PageSlug,
  PricingResponse,
  ProfileDetail,
  ProfileSummary,
  ScheduleResponse,
  SiteSettings,
} from "./types";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export class ApiNotFoundError extends Error {}

async function get<T>(path: string, locale: ApiLocale): Promise<T> {
  const url = new URL(`/api/public${path}`, API_URL);
  url.searchParams.set("locale", locale);
  const res = await fetch(url);
  if (res.status === 404) throw new ApiNotFoundError(path);
  if (!res.ok) throw new Error(`API ${res.status} for ${url.pathname}`);
  return res.json() as Promise<T>;
}

// CMS content is cached briefly; the admin portal can later call
// revalidateTag() with these tags for instant updates.
function cms(tag: string) {
  cacheLife({ stale: 30, revalidate: 60, expire: 3600 });
  cacheTag("cms", tag);
}

export async function getSettings(locale: ApiLocale) {
  "use cache";
  cms("settings");
  return get<SiteSettings>("/settings", locale);
}

export async function getPricing(locale: ApiLocale) {
  "use cache";
  cms("pricing");
  return get<PricingResponse>("/pricing", locale);
}

export async function getProfiles(locale: ApiLocale) {
  "use cache";
  cms("profiles");
  return get<ProfileSummary[]>("/profiles", locale);
}

export interface CastQuery {
  page?: number;
  pageSize?: number;
  ageMin?: number;
  ageMax?: number;
  heightMin?: number;
  heightMax?: number;
  style?: string;
  available?: CastAvailability;
}

/** Published profiles, filtered and paginated. */
export async function getCast(locale: ApiLocale, query: CastQuery = {}) {
  "use cache";
  cms("profiles");
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "") params.set(k, String(v));
  }
  const qs = params.size ? `?${params}` : "";
  // locale is appended by get(); keep the query string separate.
  return get<CastResponse>(`/cast${qs}`, locale);
}

/** Returns null for unknown or unpublished profiles. */
export async function getProfile(locale: ApiLocale, slug: string) {
  "use cache";
  cms("profiles");
  try {
    return await get<ProfileDetail>(
      `/profiles/${encodeURIComponent(slug)}`,
      locale,
    );
  } catch (e) {
    if (e instanceof ApiNotFoundError) return null;
    throw e;
  }
}

export async function getSchedule(
  locale: ApiLocale,
  opts: { date?: string; days?: number } = {},
) {
  "use cache";
  cms("schedule");
  const params = new URLSearchParams();
  if (opts.date) params.set("date", opts.date);
  if (opts.days) params.set("days", String(opts.days));
  const qs = params.size ? `?${params}` : "";
  // locale is appended by get(); keep the query string separate.
  return get<ScheduleResponse>(`/schedule${qs}`, locale);
}

/** Returns null when the page is not published in this locale. */
export async function getPage(locale: ApiLocale, slug: PageSlug) {
  "use cache";
  cms("pages");
  try {
    return await get<ContentPage>(`/pages/${slug}`, locale);
  } catch (e) {
    if (e instanceof ApiNotFoundError) return null;
    throw e;
  }
}
