import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '../generated/prisma/client.js';
import { localize, type Locale } from '../common/locale.js';
import type { CastQuery } from './public.dto.js';
import {
  addDays,
  endsNextDay,
  isValidDate,
  tokyoDateOf,
  tokyoStartOfDay,
  tokyoToday,
  toTokyoIso,
} from '../common/tokyo-time.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CastResponse,
  CastStyleOption,
  ContactChannel,
  ContentPage,
  MediaAsset,
  NavItem,
  PageSlug,
  PricingResponse,
  ProfileDetail,
  ProfileSummary,
  ScheduleDay,
  ScheduleResponse,
  ScheduleSlot,
  SiteSettings,
} from './public.types.js';

export const PAGE_SLUGS: PageSlug[] = [
  'home',
  'access',
  'recruit',
  'contact',
  'privacy',
  'terms',
  'notices',
];

const orderedMedia = {
  orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
} satisfies Prisma.Profile$mediaArgs;

type ProfileWithMedia = Prisma.ProfileGetPayload<{
  include: { media: typeof orderedMedia };
}>;
type MediaRow = ProfileWithMedia['media'][number];

interface StoredBanner {
  path: string;
  width: number;
  height: number;
  alt: unknown;
  focusX?: number;
  focusY?: number;
  mobileFocusX?: number;
  mobileFocusY?: number;
}

interface StoredChannel {
  type: ContactChannel['type'];
  label: unknown;
  value: string;
  href: string;
}

interface StoredHighlight {
  title: unknown;
  body: unknown;
}

interface StoredAttribute {
  label: unknown;
  value: unknown;
}

/** English text of a stored localized value, trimmed and lowercased. */
function englishKey(value: unknown): string {
  return localize(value, 'en').trim().toLowerCase();
}

/**
 * Age, height and style live in the free-form attributes; they are found by
 * their English label ("Age", "Height", "Style").
 */
function castFacets(attributes: unknown) {
  const attrs = (attributes ?? []) as StoredAttribute[];
  const find = (label: string) => attrs.find((a) => englishKey(a.label) === label);
  const number = (a?: StoredAttribute) => {
    const n = parseInt(localize(a?.value, 'en'), 10);
    return Number.isFinite(n) ? n : null;
  };
  const style = find('style');
  return {
    age: number(find('age')),
    height: number(find('height')),
    style: style ? { key: englishKey(style.value), value: style.value } : null,
  };
}

function inRange(n: number | null, min?: number, max?: number): boolean {
  if (min === undefined && max === undefined) return true;
  if (n === null) return false;
  return (min === undefined || n >= min) && (max === undefined || n <= max);
}

@Injectable()
export class PublicService {
  private readonly baseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.baseUrl = (
      config.get<string>('PUBLIC_BASE_URL') ?? 'http://localhost:4000'
    ).replace(/\/$/, '');
  }

  async getSettings(locale: Locale): Promise<SiteSettings> {
    const s = await this.prisma.siteSettings.findUnique({ where: { id: 1 } });
    if (!s) throw new NotFoundException('Site settings not configured');
    const ageGate = s.ageGate as Record<string, unknown>;
    return {
      siteTitle: localize(s.siteTitle, locale),
      tagline: localize(s.tagline, locale),
      logoUrl: s.logoPath ? this.mediaUrl(s.logoPath) : null,
      heroBanners: (s.heroBanners as unknown as StoredBanner[]).map((b) => ({
        url: this.mediaUrl(b.path),
        alt: localize(b.alt, locale),
        width: b.width,
        height: b.height,
        focusX: b.focusX ?? 50,
        focusY: b.focusY ?? 50,
        mobileFocusX: b.mobileFocusX ?? b.focusX ?? 50,
        mobileFocusY: b.mobileFocusY ?? b.focusY ?? 50,
      })),
      homeIntro: localize(s.homeIntro, locale),
      highlights: (s.highlights as unknown as StoredHighlight[]).map((h) => ({
        title: localize(h.title, locale),
        body: localize(h.body, locale),
      })),
      businessHours: localize(s.businessHours, locale),
      serviceArea: localize(s.serviceArea, locale),
      mapUrl: s.mapUrl,
      contactChannels: (s.contactChannels as unknown as StoredChannel[]).map(
        (c) => ({
          type: c.type,
          label: localize(c.label, locale),
          value: c.value,
          href: c.href,
        }),
      ),
      socialLinks: s.socialLinks as unknown as SiteSettings['socialLinks'],
      navigation: s.navigation as unknown as NavItem[],
      ageGate: {
        title: localize(ageGate.title, locale),
        body: localize(ageGate.body, locale),
        enterLabel: localize(ageGate.enterLabel, locale),
        leaveLabel: localize(ageGate.leaveLabel, locale),
        leaveUrl: String(ageGate.leaveUrl ?? 'https://www.google.com'),
      },
    };
  }

  async getPricing(locale: Locale): Promise<PricingResponse> {
    const [categories, settings] = await Promise.all([
      this.prisma.pricingCategory.findMany({
        where: { published: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          entries: { where: { published: true }, orderBy: { sortOrder: 'asc' } },
        },
      }),
      this.prisma.siteSettings.findUnique({
        where: { id: 1 },
        select: { pricingFootnote: true },
      }),
    ]);
    return {
      categories: categories.map((c) => ({
        id: c.id,
        title: localize(c.title, locale),
        note: localize(c.note, locale),
        entries: c.entries.map((e) => ({
          id: e.id,
          serviceLabel: localize(e.serviceLabel, locale),
          durationMinutes: e.durationMinutes,
          amount: e.amount,
          currency: e.currency,
          description: localize(e.description, locale),
        })),
      })),
      footnote: localize(settings?.pricingFootnote, locale),
    };
  }

  async listProfiles(locale: Locale): Promise<ProfileSummary[]> {
    const profiles = await this.prisma.profile.findMany({
      where: { visibility: 'PUBLISHED' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { media: orderedMedia },
    });
    return profiles.map((p) => this.toSummary(p, locale));
  }

  /**
   * Published profiles, filtered and paginated. The cast is small, so age,
   * height and style (stored in JSON attributes) are filtered in memory;
   * availability is filtered in the database against the schedule.
   */
  async listCast(q: CastQuery): Promise<CastResponse> {
    const profiles = await this.prisma.profile.findMany({
      where: { visibility: 'PUBLISHED' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { media: orderedMedia },
    });
    const available = q.available
      ? await this.availableProfileIds(q.available)
      : null;

    const styles = new Map<string, CastStyleOption>();
    const style = q.style?.trim().toLowerCase();
    const matches = profiles.filter((p) => {
      const f = castFacets(p.attributes);
      if (f.style?.key && !styles.has(f.style.key)) {
        styles.set(f.style.key, {
          value: f.style.key,
          label: localize(f.style.value, q.locale),
        });
      }
      return (
        (!available || available.has(p.id)) &&
        inRange(f.age, q.ageMin, q.ageMax) &&
        inRange(f.height, q.heightMin, q.heightMax) &&
        (!style || f.style?.key === style)
      );
    });

    const pages = Math.max(1, Math.ceil(matches.length / q.pageSize));
    const page = Math.min(q.page, pages);
    const start = (page - 1) * q.pageSize;
    return {
      items: matches
        .slice(start, start + q.pageSize)
        .map((p) => this.toSummary(p, q.locale)),
      total: matches.length,
      page,
      pageSize: q.pageSize,
      pages,
      styles: [...styles.values()].sort((a, b) =>
        a.label.localeCompare(b.label, q.locale),
      ),
    };
  }

  /** Profiles with a scheduled (not day off / cancelled) slot in the window. */
  private async availableProfileIds(
    when: CastQuery['available'],
  ): Promise<Set<string>> {
    const now = new Date();
    const today = tokyoToday(now);
    const window: Prisma.ScheduleSlotWhereInput =
      when === 'now'
        ? { startAt: { lte: now }, endAt: { gt: now } }
        : {
            endAt: { gt: now },
            startAt: {
              lt: tokyoStartOfDay(addDays(today, when === 'today' ? 1 : 7)),
            },
          };
    const slots = await this.prisma.scheduleSlot.findMany({
      where: { ...window, status: 'SCHEDULED' },
      select: { profileId: true },
      distinct: ['profileId'],
    });
    return new Set(slots.map((s) => s.profileId));
  }

  async getProfile(slug: string, locale: Locale): Promise<ProfileDetail> {
    const profile = await this.prisma.profile.findFirst({
      where: { slug, visibility: 'PUBLISHED' },
      include: { media: orderedMedia },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    const today = tokyoToday();
    const schedule = await this.loadSchedule(today, 7, locale, profile.id);
    return {
      ...this.toSummary(profile, locale),
      bio: localize(profile.bio, locale),
      comment: localize(profile.comment, locale),
      gallery: profile.media.map((m) => this.toMedia(m, locale)),
      schedule,
    };
  }

  async getSchedule(
    locale: Locale,
    date: string | undefined,
    days: number,
  ): Promise<ScheduleResponse> {
    const today = tokyoToday();
    const from = date ?? today;
    if (!isValidDate(from)) throw new BadRequestException('Invalid date');
    return {
      timezone: 'Asia/Tokyo',
      today,
      days: await this.loadSchedule(from, days, locale),
    };
  }

  async getPage(slug: string, locale: Locale): Promise<ContentPage> {
    if (!PAGE_SLUGS.includes(slug as PageSlug)) {
      throw new NotFoundException('Page not found');
    }
    const page = await this.prisma.contentPage.findFirst({
      where: { slug, locale, status: 'PUBLISHED' },
    });
    if (!page) throw new NotFoundException('Page not found');
    return {
      slug: page.slug as PageSlug,
      title: page.title,
      body: page.body,
      seoTitle: page.seoTitle,
      metaDescription: page.metaDescription,
      updatedAt: page.updatedAt.toISOString(),
    };
  }

  /** Slots of published profiles grouped by the Tokyo date of their start. */
  private async loadSchedule(
    from: string,
    days: number,
    locale: Locale,
    profileId?: string,
  ): Promise<ScheduleDay[]> {
    const slots = await this.prisma.scheduleSlot.findMany({
      where: {
        startAt: {
          gte: tokyoStartOfDay(from),
          lt: tokyoStartOfDay(addDays(from, days)),
        },
        status: { not: 'CANCELLED' },
        profile: { visibility: 'PUBLISHED' },
        ...(profileId ? { profileId } : {}),
      },
      orderBy: [{ startAt: 'asc' }, { profile: { sortOrder: 'asc' } }],
      include: { profile: { include: { media: orderedMedia } } },
    });

    const result: ScheduleDay[] = Array.from({ length: days }, (_, i) => ({
      date: addDays(from, i),
      slots: [],
    }));
    const byDate = new Map(result.map((d) => [d.date, d.slots]));

    for (const slot of slots) {
      const summary = this.toSummary(slot.profile, locale);
      const entry: ScheduleSlot = {
        id: slot.id,
        status: slot.status === 'DAY_OFF' ? 'day_off' : 'scheduled',
        start: toTokyoIso(slot.startAt),
        end: toTokyoIso(slot.endAt),
        endsNextDay: endsNextDay(slot.startAt, slot.endAt),
        note: localize(slot.publicNote, locale),
        profile: {
          slug: summary.slug,
          displayName: summary.displayName,
          primaryImage: summary.primaryImage,
        },
      };
      byDate.get(tokyoDateOf(slot.startAt))?.push(entry);
    }
    return result;
  }

  private toSummary(p: ProfileWithMedia, locale: Locale): ProfileSummary {
    const primary = p.media[0];
    return {
      id: p.id,
      slug: p.slug,
      displayName: localize(p.displayName, locale),
      attributes: (p.attributes as unknown as StoredAttribute[]).map((a) => ({
        label: localize(a.label, locale),
        value: localize(a.value, locale),
      })),
      primaryImage: primary ? this.toMedia(primary, locale) : null,
      isNew: p.isNew,
    };
  }

  private toMedia(m: MediaRow, locale: Locale): MediaAsset {
    return {
      url: this.mediaUrl(m.path),
      alt: localize(m.altText, locale),
      width: m.width,
      height: m.height,
    };
  }

  private mediaUrl(path: string): string {
    return `${this.baseUrl}/uploads/${path.replace(/^\/+/, '')}`;
  }
}
