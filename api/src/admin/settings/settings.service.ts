import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { toLocalized } from '../admin.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { NAV_KEYS, type SettingsDto } from './settings.dto.js';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async get() {
    const s = await this.prisma.siteSettings.findUnique({ where: { id: 1 } });
    if (!s) throw new NotFoundException('Site settings not configured. Run the seed.');
    return { ...s, updatedAt: s.updatedAt.toISOString() };
  }

  async save(dto: SettingsDto, actorId: string) {
    const nav = dto.navigation.map((n) => n.key);
    if (nav.length !== NAV_KEYS.length || !NAV_KEYS.every((k) => nav.includes(k))) {
      throw new BadRequestException('Navigation must list every menu item once');
    }
    if (!dto.siteTitle.en?.trim()) throw new BadRequestException('Site title is required');

    // Logo and banners must be uploaded images (CMS-06: approved uploads only).
    const paths = [...dto.heroBanners.map((b) => b.path), ...(dto.logoPath ? [dto.logoPath] : [])];
    const assets = await this.prisma.mediaAsset.findMany({ where: { path: { in: paths } } });
    const byPath = new Map(assets.map((a) => [a.path, a]));
    const missing = paths.find((p) => !byPath.has(p));
    if (missing) throw new BadRequestException('Upload an image for the logo and each banner');

    const loc = toLocalized;
    await this.prisma.siteSettings.update({
      where: { id: 1 },
      data: {
        siteTitle: loc(dto.siteTitle),
        tagline: loc(dto.tagline),
        logoPath: dto.logoPath || null,
        heroBanners: dto.heroBanners.map((b) => {
          const a = byPath.get(b.path)!;
          return {
            path: a.path,
            width: a.width,
            height: a.height,
            alt: loc(b.alt),
            focusX: b.focusX ?? 50,
            focusY: b.focusY ?? 50,
            mobileFocusX: b.mobileFocusX ?? b.focusX ?? 50,
            mobileFocusY: b.mobileFocusY ?? b.focusY ?? 50,
          };
        }),
        homeIntro: loc(dto.homeIntro),
        highlights: dto.highlights.map((h) => ({ title: loc(h.title), body: loc(h.body) })),
        businessHours: loc(dto.businessHours),
        serviceArea: loc(dto.serviceArea),
        mapUrl: dto.mapUrl || null,
        contactChannels: dto.contactChannels.map((c) => ({
          type: c.type,
          label: loc(c.label),
          value: c.value.trim(),
          href: c.href.trim(),
        })),
        socialLinks: dto.socialLinks.map((s) => ({ label: s.label.trim(), url: s.url.trim() })),
        navigation: dto.navigation.map((n) => ({ key: n.key, visible: n.visible })),
        ageGate: {
          title: loc(dto.ageGate.title),
          body: loc(dto.ageGate.body),
          enterLabel: loc(dto.ageGate.enterLabel),
          leaveLabel: loc(dto.ageGate.leaveLabel),
          leaveUrl: dto.ageGate.leaveUrl,
        },
        pricingFootnote: loc(dto.pricingFootnote),
      },
    });
    await this.audit.record(actorId, 'settings.update', 'SiteSettings', '1');
    return this.get();
  }
}
