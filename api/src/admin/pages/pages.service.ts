import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LOCALES, type Locale } from '../../common/locale.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PAGE_SLUGS } from '../../public/public.service.js';
import type { PageSlug } from '../../public/public.types.js';
import { AuditService } from '../audit/audit.service.js';
import type { PageDto } from './pages.dto.js';

/** Static pages, edited and published per locale (CMS-05). */
@Injectable()
export class PagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list() {
    const pages = await this.prisma.contentPage.findMany({
      include: { lastEditedBy: { select: { login: true } } },
    });
    return PAGE_SLUGS.map((slug) => ({
      slug,
      locales: Object.fromEntries(
        LOCALES.map((locale) => {
          const p = pages.find((x) => x.slug === slug && x.locale === locale);
          return [
            locale,
            p
              ? {
                  title: p.title,
                  status: p.status,
                  updatedAt: p.updatedAt.toISOString(),
                  lastEditedBy: p.lastEditedBy?.login ?? null,
                }
              : null,
          ];
        }),
      ),
    }));
  }

  async get(slug: string, locale: string) {
    this.check(slug, locale);
    const page = await this.prisma.contentPage.findUnique({
      where: { slug_locale: { slug, locale } },
      include: { lastEditedBy: { select: { login: true } } },
    });
    if (!page) {
      // Not written yet in this locale: return an empty draft to start from.
      return {
        slug,
        locale,
        exists: false,
        title: '',
        body: '',
        seoTitle: '',
        metaDescription: '',
        status: 'DRAFT' as const,
        updatedAt: null,
        lastEditedBy: null,
      };
    }
    return {
      slug,
      locale,
      exists: true,
      title: page.title,
      body: page.body,
      seoTitle: page.seoTitle,
      metaDescription: page.metaDescription,
      status: page.status,
      updatedAt: page.updatedAt.toISOString(),
      lastEditedBy: page.lastEditedBy?.login ?? null,
    };
  }

  async save(slug: string, locale: string, dto: PageDto, actorId: string) {
    this.check(slug, locale);
    if (dto.status === 'PUBLISHED' && !dto.title.trim()) {
      throw new BadRequestException('A title is required to publish');
    }
    const data = {
      title: dto.title.trim(),
      body: dto.body,
      seoTitle: dto.seoTitle.trim(),
      metaDescription: dto.metaDescription.trim(),
      status: dto.status,
      lastEditedById: actorId,
    };
    const page = await this.prisma.contentPage.upsert({
      where: { slug_locale: { slug, locale } },
      create: { slug, locale, ...data },
      update: data,
    });
    await this.audit.record(actorId, `page.save_${dto.status.toLowerCase()}`, 'ContentPage', page.id);
    return this.get(slug, locale);
  }

  private check(slug: string, locale: string) {
    if (!PAGE_SLUGS.includes(slug as PageSlug)) throw new NotFoundException('Unknown page');
    if (!LOCALES.includes(locale as Locale)) throw new NotFoundException('Unknown locale');
  }
}
