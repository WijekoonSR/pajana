import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { toLocalized } from '../admin.dto.js';
import { AuditService } from '../audit/audit.service.js';
import type { CategoryDto, EntryDto } from './pricing.dto.js';

/** Foreign-site pricing only; nothing here reads from or writes to the Japanese site. */
@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list() {
    const [categories, settings] = await Promise.all([
      this.prisma.pricingCategory.findMany({
        orderBy: { sortOrder: 'asc' },
        include: { entries: { orderBy: { sortOrder: 'asc' } } },
      }),
      this.prisma.siteSettings.findUnique({
        where: { id: 1 },
        select: { pricingFootnote: true },
      }),
    ]);
    return { categories, footnote: settings?.pricingFootnote ?? toLocalized(undefined) };
  }

  async createCategory(dto: CategoryDto, actorId: string) {
    this.requireEnglish(dto.title, 'Category title');
    const last = await this.prisma.pricingCategory.aggregate({ _max: { sortOrder: true } });
    const c = await this.prisma.pricingCategory.create({
      data: {
        title: toLocalized(dto.title),
        note: toLocalized(dto.note),
        published: dto.published ?? false,
        sortOrder: (last._max.sortOrder ?? -1) + 1,
      },
    });
    await this.audit.record(actorId, 'pricing_category.create', 'PricingCategory', c.id);
    return c;
  }

  async updateCategory(id: string, dto: CategoryDto, actorId: string) {
    await this.findCategory(id);
    this.requireEnglish(dto.title, 'Category title');
    const c = await this.prisma.pricingCategory.update({
      where: { id },
      data: {
        title: toLocalized(dto.title),
        note: toLocalized(dto.note),
        published: dto.published,
      },
    });
    await this.audit.record(actorId, 'pricing_category.update', 'PricingCategory', id);
    return c;
  }

  async removeCategory(id: string, actorId: string) {
    await this.findCategory(id);
    await this.prisma.pricingCategory.delete({ where: { id } });
    await this.audit.record(actorId, 'pricing_category.delete', 'PricingCategory', id);
  }

  async reorderCategories(ids: string[], actorId: string) {
    await this.prisma.$transaction(
      ids.map((id, sortOrder) =>
        this.prisma.pricingCategory.update({ where: { id }, data: { sortOrder } }),
      ),
    );
    await this.audit.record(actorId, 'pricing_category.reorder', 'PricingCategory', '*');
    return this.list();
  }

  async createEntry(dto: EntryDto, actorId: string) {
    await this.findCategory(dto.categoryId);
    this.requireEnglish(dto.serviceLabel, 'Service label');
    const last = await this.prisma.pricingEntry.aggregate({
      where: { categoryId: dto.categoryId },
      _max: { sortOrder: true },
    });
    const e = await this.prisma.pricingEntry.create({
      data: { ...this.entryData(dto), sortOrder: (last._max.sortOrder ?? -1) + 1 },
    });
    await this.audit.record(actorId, 'pricing_entry.create', 'PricingEntry', e.id);
    return e;
  }

  async updateEntry(id: string, dto: EntryDto, actorId: string) {
    await this.findEntry(id);
    await this.findCategory(dto.categoryId);
    this.requireEnglish(dto.serviceLabel, 'Service label');
    const e = await this.prisma.pricingEntry.update({ where: { id }, data: this.entryData(dto) });
    await this.audit.record(actorId, 'pricing_entry.update', 'PricingEntry', id);
    return e;
  }

  async removeEntry(id: string, actorId: string) {
    await this.findEntry(id);
    await this.prisma.pricingEntry.delete({ where: { id } });
    await this.audit.record(actorId, 'pricing_entry.delete', 'PricingEntry', id);
  }

  async reorderEntries(categoryId: string, ids: string[], actorId: string) {
    const entries = await this.prisma.pricingEntry.findMany({ where: { categoryId } });
    const own = new Set(entries.map((e) => e.id));
    if (ids.length !== own.size || !ids.every((id) => own.has(id))) {
      throw new BadRequestException('Order must list every line of this category once');
    }
    await this.prisma.$transaction(
      ids.map((id, sortOrder) =>
        this.prisma.pricingEntry.update({ where: { id }, data: { sortOrder } }),
      ),
    );
    await this.audit.record(actorId, 'pricing_entry.reorder', 'PricingCategory', categoryId);
    return this.list();
  }

  private entryData(dto: EntryDto) {
    return {
      categoryId: dto.categoryId,
      serviceLabel: toLocalized(dto.serviceLabel),
      durationMinutes: dto.durationMinutes ?? null,
      amount: dto.amount,
      currency: dto.currency,
      description: toLocalized(dto.description),
      published: dto.published ?? false,
    };
  }

  private requireEnglish(value: { en?: string } | undefined, label: string) {
    if (!value?.en?.trim()) throw new BadRequestException(`${label} in English is required`);
  }

  private async findCategory(id: string) {
    const c = await this.prisma.pricingCategory.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Category not found');
    return c;
  }

  private async findEntry(id: string) {
    const e = await this.prisma.pricingEntry.findUnique({ where: { id } });
    if (!e) throw new NotFoundException('Price line not found');
    return e;
  }
}
