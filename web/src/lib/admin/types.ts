// Admin API contract (pink-api /api/admin/*). Localized fields arrive raw,
// one string per locale, so every language can be edited separately.

export const ADMIN_LOCALES = ["en", "zh-TW", "zh-CN"] as const;
export type AdminLocale = (typeof ADMIN_LOCALES)[number];
export type Localized = Record<AdminLocale, string>;

export const LOCALE_LABEL: Record<AdminLocale, string> = {
  en: "English",
  "zh-TW": "繁中 Taiwan",
  "zh-CN": "简中 Mainland",
};
export const LOCALE_SHORT: Record<AdminLocale, string> = {
  en: "EN",
  "zh-TW": "繁中",
  "zh-CN": "简中",
};

export type AdminRole = "OWNER" | "EDITOR";
export type AdminStatus = "ACTIVE" | "DISABLED";
export type Visibility = "DRAFT" | "PUBLISHED" | "HIDDEN" | "ARCHIVED";
export type SlotStatus = "SCHEDULED" | "DAY_OFF" | "CANCELLED";
export type PageStatus = "DRAFT" | "PUBLISHED";

export interface AdminUser {
  id: string;
  login: string;
  role: AdminRole;
}

export interface AuditEntry {
  id: string;
  action: string;
  objectType: string;
  objectId: string;
  occurredAt: string;
  actor: string | null;
}

export interface AuditPage {
  total: number;
  page: number;
  pageSize: number;
  entries: AuditEntry[];
}

export interface Dashboard {
  today: string;
  profiles: Partial<Record<Visibility, number>>;
  todaySlots: number;
  draftPages: number;
  mediaCount: number;
  recentActivity: AuditEntry[];
}

export interface ProfileRow {
  id: string;
  slug: string;
  displayName: Localized;
  visibility: Visibility;
  isNew: boolean;
  sortOrder: number;
  updatedAt: string;
  thumbnail: string | null;
  mediaCount: number;
  slotCount: number;
  missingLocales: AdminLocale[];
}

export type ProfileTab = "active" | "published" | "draft" | "hidden" | "archived";

export interface ProfilePage {
  items: ProfileRow[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  counts: Record<ProfileTab, number>;
}

export interface ProfileMedia {
  id: string;
  path: string;
  width: number;
  height: number;
  altText: Localized;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProfileAttribute {
  label: Localized;
  value: Localized;
}

export interface Profile {
  id: string;
  slug: string;
  displayName: Localized;
  attributes: ProfileAttribute[];
  bio: Localized;
  comment: Localized;
  sortOrder: number;
  visibility: Visibility;
  isNew: boolean;
  createdAt: string;
  updatedAt: string;
  media: ProfileMedia[];
  missingLocales: AdminLocale[];
}

export interface MediaItem {
  id: string;
  path: string;
  width: number;
  height: number;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
  uploadedBy: string | null;
  createdAt: string;
  usedBy: string[];
}

export interface Slot {
  id: string;
  profileId: string;
  date: string;
  start: string;
  end: string;
  startTime: string;
  endTime: string;
  endsNextDay: boolean;
  status: SlotStatus;
  publicNote: Localized;
  profile: { id: string; slug: string; displayName: Localized; visibility: Visibility };
}

export interface ScheduleRange {
  timezone: "Asia/Tokyo";
  today: string;
  from: string;
  days: number;
  slots: Slot[];
}

export interface PriceEntry {
  id: string;
  categoryId: string;
  serviceLabel: Localized;
  durationMinutes: number | null;
  amount: number;
  currency: string;
  description: Localized;
  published: boolean;
  sortOrder: number;
}

export interface PriceCategory {
  id: string;
  title: Localized;
  note: Localized;
  sortOrder: number;
  published: boolean;
  entries: PriceEntry[];
}

export interface Pricing {
  categories: PriceCategory[];
  footnote: Localized;
}

export type PageSlug = "home" | "access" | "recruit" | "contact" | "privacy" | "terms" | "notices";

export interface PageSummary {
  title: string;
  status: PageStatus;
  updatedAt: string;
  lastEditedBy: string | null;
}

export interface PageRow {
  slug: PageSlug;
  locales: Record<AdminLocale, PageSummary | null>;
}

export interface PageDoc {
  slug: PageSlug;
  locale: AdminLocale;
  exists: boolean;
  title: string;
  body: string;
  seoTitle: string;
  metaDescription: string;
  status: PageStatus;
  updatedAt: string | null;
  lastEditedBy: string | null;
}

export type ChannelType = "phone" | "sms" | "email" | "line" | "whatsapp" | "telegram";
export type NavKey = "top" | "system" | "schedule" | "cast" | "access" | "recruit" | "contact";

export interface Settings {
  siteTitle: Localized;
  tagline: Localized;
  logoPath: string | null;
  heroBanners: { path: string; width: number; height: number; alt: Localized }[];
  homeIntro: Localized;
  highlights: { title: Localized; body: Localized }[];
  businessHours: Localized;
  serviceArea: Localized;
  mapUrl: string | null;
  contactChannels: { type: ChannelType; label: Localized; value: string; href: string }[];
  socialLinks: { label: string; url: string }[];
  navigation: { key: NavKey; visible: boolean }[];
  ageGate: {
    title: Localized;
    body: Localized;
    enterLabel: Localized;
    leaveLabel: Localized;
    leaveUrl: string;
  };
  pricingFootnote: Localized;
  updatedAt: string;
}

export interface UserRow {
  id: string;
  login: string;
  role: AdminRole;
  status: AdminStatus;
  lastLoginAt: string | null;
  lockedUntil: string | null;
  createdAt: string;
}

/** Result of every admin Server Action, shown by <ActionForm>. */
export interface ActionState {
  ok: boolean;
  message?: string;
  error?: string;
  /** Changes on every submit so repeated identical messages still show. */
  at?: number;
}
