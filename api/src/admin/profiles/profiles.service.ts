import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { LOCALES, type Localized } from '../../common/locale.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { toLocalized } from '../admin.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { MediaService } from '../media/media.service.js';
import type {
  AddProfileMediaDto,
  CreateProfileDto,
  ProfileListQuery,
  ProfileTab,
  UpdateProfileDto,
  UpdateProfileMediaDto,
} from './profiles.dto.js';

const ORDER = [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }] satisfies Prisma.ProfileOrderByWithRelationInput[];

const TAB_FILTER: Record<ProfileTab, Prisma.ProfileWhereInput> = {
  active: { visibility: { not: 'ARCHIVED' } },
  published: { visibility: 'PUBLISHED' },
  draft: { visibility: 'DRAFT' },
  hidden: { visibility: 'HIDDEN' },
  archived: { visibility: 'ARCHIVED' },
};

const LIST_INCLUDE = {
  media: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
  _count: { select: { schedule: true } },
} satisfies Prisma.ProfileInclude;

type ListRow = Prisma.ProfileGetPayload<{ include: typeof LIST_INCLUDE }>;

/** Locales with an empty display name or bio, flagged in the CMS (SRS 07). */
function missingLocales(p: { displayName: unknown; bio: unknown }) {
  const name = p.displayName as Localized;
  const bio = p.bio as Localized;
  return LOCALES.filter((l) => !name?.[l]?.trim() || !bio?.[l]?.trim());
}

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly media: MediaService,
  ) {}

  /** Every profile, for pickers (schedule, slot form). */
  async options() {
    const profiles = await this.prisma.profile.findMany({ orderBy: ORDER, include: LIST_INCLUDE });
    return profiles.map((p) => this.toRow(p));
  }

  /** One page of profiles, filtered and searched in the database. */
  async page(query: ProfileListQuery) {
    const search = await this.searchFilter(query.q);
    const where: Prisma.ProfileWhereInput = { AND: [TAB_FILTER[query.status], search] };
    const [total, counts, rows] = await Promise.all([
      this.prisma.profile.count({ where }),
      this.prisma.profile.groupBy({ by: ['visibility'], where: search, _count: true }),
      this.prisma.profile.findMany({
        where,
        orderBy: ORDER,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: LIST_INCLUDE,
      }),
    ]);
    const by = Object.fromEntries(counts.map((c) => [c.visibility, c._count])) as Record<string, number>;
    return {
      items: rows.map((p) => this.toRow(p)),
      total,
      page: query.page,
      pageSize: query.pageSize,
      pages: Math.max(1, Math.ceil(total / query.pageSize)),
      counts: {
        active: (by.PUBLISHED ?? 0) + (by.DRAFT ?? 0) + (by.HIDDEN ?? 0),
        published: by.PUBLISHED ?? 0,
        draft: by.DRAFT ?? 0,
        hidden: by.HIDDEN ?? 0,
        archived: by.ARCHIVED ?? 0,
      },
    };
  }

  /**
   * Swaps a profile with its neighbour in the public order (archived ones are
   * skipped). Works across pages, unlike reordering a visible list.
   */
  async move(id: string, direction: 'up' | 'down', actorId: string) {
    const all = await this.prisma.profile.findMany({
      orderBy: ORDER,
      select: { id: true, visibility: true },
    });
    const index = all.findIndex((p) => p.id === id);
    if (index === -1) throw new NotFoundException('Profile not found');
    const step = direction === 'up' ? -1 : 1;
    let target = index + step;
    while (all[target] && all[target].visibility === 'ARCHIVED') target += step;
    if (!all[target]) return;
    [all[index], all[target]] = [all[target], all[index]];
    // Rewrite positions as 0..n-1 so ties from older data cannot persist.
    await this.prisma.$transaction(
      all.map((p, sortOrder) => this.prisma.profile.update({ where: { id: p.id }, data: { sortOrder } })),
    );
    await this.audit.record(actorId, 'profile.reorder', 'Profile', id);
  }

  /** Case-insensitive match on the slug or any language of the display name. */
  private async searchFilter(q?: string): Promise<Prisma.ProfileWhereInput> {
    const term = q?.trim();
    if (!term) return {};
    const like = `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Profile"
      WHERE slug ILIKE ${like}
         OR EXISTS (SELECT 1 FROM jsonb_each_text("displayName") AS n WHERE n.value ILIKE ${like})`;
    return { id: { in: rows.map((r) => r.id) } };
  }

  private toRow(p: ListRow) {
    return {
      id: p.id,
      slug: p.slug,
      displayName: p.displayName,
      visibility: p.visibility,
      isNew: p.isNew,
      sortOrder: p.sortOrder,
      updatedAt: p.updatedAt.toISOString(),
      thumbnail: p.media[0]?.path ?? null,
      mediaCount: p.media.length,
      slotCount: p._count.schedule,
      missingLocales: missingLocales(p),
    };
  }

  async get(id: string) {
    const p = await this.prisma.profile.findUnique({
      where: { id },
      include: { media: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!p) throw new NotFoundException('Profile not found');
    return {
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      missingLocales: missingLocales(p),
    };
  }

  async create(dto: CreateProfileDto, actorId: string) {
    if (!dto.slug) throw new BadRequestException('Slug is required');
    if (!dto.displayName?.en?.trim()) {
      throw new BadRequestException('English display name is required');
    }
    const last = await this.prisma.profile.aggregate({ _max: { sortOrder: true } });
    const profile = await this.guardSlug(() =>
      this.prisma.profile.create({
        data: {
          slug: dto.slug,
          displayName: toLocalized(dto.displayName),
          attributes: (dto.attributes ?? []).map((a) => ({
            label: toLocalized(a.label),
            value: toLocalized(a.value),
          })),
          bio: toLocalized(dto.bio),
          comment: toLocalized(dto.comment),
          // New profiles always start as drafts (SRS 06 workflow).
          visibility: 'DRAFT',
          isNew: dto.isNew ?? false,
          sortOrder: (last._max.sortOrder ?? -1) + 1,
        },
      }),
    );
    await this.audit.record(actorId, 'profile.create', 'Profile', profile.id);
    return this.get(profile.id);
  }

  async update(id: string, dto: UpdateProfileDto, actorId: string) {
    await this.get(id);
    if (dto.displayName && !dto.displayName.en?.trim()) {
      throw new BadRequestException('English display name is required');
    }
    await this.guardSlug(() =>
      this.prisma.profile.update({
        where: { id },
        data: {
          slug: dto.slug,
          displayName: dto.displayName && toLocalized(dto.displayName),
          attributes: dto.attributes?.map((a) => ({
            label: toLocalized(a.label),
            value: toLocalized(a.value),
          })),
          bio: dto.bio && toLocalized(dto.bio),
          comment: dto.comment && toLocalized(dto.comment),
          visibility: dto.visibility,
          isNew: dto.isNew,
        },
      }),
    );
    const action = dto.visibility ? `profile.${dto.visibility.toLowerCase()}` : 'profile.update';
    await this.audit.record(actorId, action, 'Profile', id);
    return this.get(id);
  }

  async remove(id: string, actorId: string) {
    const p = await this.get(id);
    if (p.visibility !== 'ARCHIVED') {
      throw new BadRequestException('Archive the profile before deleting it');
    }
    await this.prisma.profile.delete({ where: { id } });
    // Images belong to one cast member; drop their files with the profile.
    for (const m of p.media) await this.media.deleteIfUnused(m.path);
    await this.audit.record(actorId, 'profile.delete', 'Profile', id);
  }

  async reorder(ids: string[], actorId: string) {
    await this.prisma.$transaction(
      ids.map((id, sortOrder) => this.prisma.profile.update({ where: { id }, data: { sortOrder } })),
    );
    await this.audit.record(actorId, 'profile.reorder', 'Profile', '*');
    return this.options();
  }

  // --- Gallery ---------------------------------------------------------------

  async addMedia(profileId: string, dto: AddProfileMediaDto, actorId: string) {
    const profile = await this.get(profileId);
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id: dto.assetId } });
    if (!asset) throw new NotFoundException('Image not found');
    if (profile.media.some((m) => m.path === asset.path)) {
      throw new ConflictException('This image is already in the gallery');
    }
    const media = await this.prisma.profileMedia.create({
      data: {
        profileId,
        path: asset.path,
        width: asset.width,
        height: asset.height,
        altText: toLocalized(dto.altText),
        sortOrder: profile.media.length,
        isPrimary: profile.media.length === 0,
      },
    });
    await this.audit.record(actorId, 'profile_media.add', 'ProfileMedia', media.id);
    return this.get(profileId);
  }

  async updateMedia(profileId: string, mediaId: string, dto: UpdateProfileMediaDto, actorId: string) {
    await this.findMedia(profileId, mediaId);
    await this.prisma.$transaction([
      ...(dto.isPrimary
        ? [this.prisma.profileMedia.updateMany({ where: { profileId }, data: { isPrimary: false } })]
        : []),
      this.prisma.profileMedia.update({
        where: { id: mediaId },
        data: {
          altText: dto.altText && toLocalized(dto.altText),
          isPrimary: dto.isPrimary,
        },
      }),
    ]);
    await this.audit.record(actorId, 'profile_media.update', 'ProfileMedia', mediaId);
    return this.get(profileId);
  }

  async removeMedia(profileId: string, mediaId: string, actorId: string) {
    const media = await this.findMedia(profileId, mediaId);
    await this.prisma.profileMedia.delete({ where: { id: mediaId } });
    await this.media.deleteIfUnused(media.path);
    if (media.isPrimary) {
      const next = await this.prisma.profileMedia.findFirst({
        where: { profileId },
        orderBy: { sortOrder: 'asc' },
      });
      if (next) {
        await this.prisma.profileMedia.update({ where: { id: next.id }, data: { isPrimary: true } });
      }
    }
    await this.audit.record(actorId, 'profile_media.remove', 'ProfileMedia', mediaId);
    return this.get(profileId);
  }

  async reorderMedia(profileId: string, ids: string[], actorId: string) {
    const profile = await this.get(profileId);
    const own = new Set(profile.media.map((m) => m.id));
    if (ids.length !== own.size || !ids.every((id) => own.has(id))) {
      throw new BadRequestException('Order must list every image of this profile once');
    }
    await this.prisma.$transaction(
      ids.map((id, sortOrder) =>
        this.prisma.profileMedia.update({ where: { id }, data: { sortOrder } }),
      ),
    );
    await this.audit.record(actorId, 'profile_media.reorder', 'Profile', profileId);
    return this.get(profileId);
  }

  private async findMedia(profileId: string, mediaId: string) {
    const media = await this.prisma.profileMedia.findFirst({ where: { id: mediaId, profileId } });
    if (!media) throw new NotFoundException('Image not found in this profile');
    return media;
  }

  private async guardSlug<T>(op: () => Promise<T>): Promise<T> {
    try {
      return await op();
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Another profile already uses this slug');
      }
      throw e;
    }
  }
}
