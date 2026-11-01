// Public API response contract. Keep in sync with web/src/lib/api/types.ts.
// All localized text is resolved for the requested locale (English fallback).

export type ApiLocale = "en" | "zh-TW" | "zh-CN";

export type ContactChannelType =
  | "phone"
  | "sms"
  | "email"
  | "line"
  | "whatsapp"
  | "telegram";

export interface ContactChannel {
  type: ContactChannelType;
  label: string;
  value: string;
  href: string;
}

export type NavKey =
  | "top"
  | "system"
  | "schedule"
  | "cast"
  | "access"
  | "recruit"
  | "contact";

export interface NavItem {
  key: NavKey;
  visible: boolean;
}

export interface MediaAsset {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface Highlight {
  title: string;
  body: string;
}

export interface SiteSettings {
  siteTitle: string;
  tagline: string;
  logoUrl: string | null;
  heroBanners: MediaAsset[];
  homeIntro: string;
  highlights: Highlight[];
  businessHours: string;
  serviceArea: string;
  mapUrl: string | null;
  contactChannels: ContactChannel[];
  socialLinks: { label: string; url: string }[];
  navigation: NavItem[];
  ageGate: {
    title: string;
    body: string;
    enterLabel: string;
    leaveLabel: string;
    leaveUrl: string;
  };
}

export interface PricingEntry {
  id: string;
  serviceLabel: string;
  durationMinutes: number | null;
  amount: number;
  currency: string;
  description: string;
}

export interface PricingCategory {
  id: string;
  title: string;
  note: string;
  entries: PricingEntry[];
}

export interface PricingResponse {
  categories: PricingCategory[];
  footnote: string;
}

export interface ProfileAttribute {
  label: string;
  value: string;
}

export interface ProfileSummary {
  id: string;
  slug: string;
  displayName: string;
  attributes: ProfileAttribute[];
  primaryImage: MediaAsset | null;
  isNew: boolean;
}

export type CastAvailability = "now" | "today" | "week";

export interface CastStyleOption {
  /** Filter key: the English style value, lowercased. */
  value: string;
  label: string;
}

export interface CastResponse {
  items: ProfileSummary[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  /** Styles of all published profiles, for the filter dropdown. */
  styles: CastStyleOption[];
}

export type ScheduleStatus = "scheduled" | "day_off";

export interface ScheduleSlot {
  id: string;
  status: ScheduleStatus;
  /** ISO 8601 with +09:00 offset (Asia/Tokyo). */
  start: string;
  end: string;
  /** True when the slot ends on the next calendar day (overnight). */
  endsNextDay: boolean;
  note: string;
  profile: Pick<ProfileSummary, "slug" | "displayName" | "primaryImage">;
}

export interface ScheduleDay {
  /** Asia/Tokyo calendar date, YYYY-MM-DD. */
  date: string;
  slots: ScheduleSlot[];
}

export interface ScheduleResponse {
  timezone: "Asia/Tokyo";
  /** Today in Asia/Tokyo, YYYY-MM-DD. */
  today: string;
  days: ScheduleDay[];
}

export interface ProfileDetail extends ProfileSummary {
  bio: string;
  comment: string;
  gallery: MediaAsset[];
  /** Next 7 days starting today (Asia/Tokyo). */
  schedule: ScheduleDay[];
}

export type PageSlug =
  | "home"
  | "access"
  | "recruit"
  | "contact"
  | "privacy"
  | "terms"
  | "notices";

export interface ContentPage {
  slug: PageSlug;
  title: string;
  /** Markdown (no raw HTML). */
  body: string;
  seoTitle: string;
  metaDescription: string;
  updatedAt: string;
}
