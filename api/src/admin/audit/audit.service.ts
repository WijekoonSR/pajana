import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

/**
 * Change accountability (CMS-08): who did what to which record, and when.
 * Only identifiers are logged, never submitted text or secrets.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(actorId: string | null, action: string, objectType: string, objectId: string) {
    await this.prisma.auditEntry.create({ data: { actorId, action, objectType, objectId } });
  }

  async list(page: number, pageSize: number) {
    const [total, entries] = await Promise.all([
      this.prisma.auditEntry.count(),
      this.prisma.auditEntry.findMany({
        orderBy: { occurredAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { actor: { select: { login: true } } },
      }),
    ]);
    return {
      total,
      page,
      pageSize,
      entries: entries.map((e) => ({
        id: e.id,
        action: e.action,
        objectType: e.objectType,
        objectId: e.objectId,
        occurredAt: e.occurredAt.toISOString(),
        actor: e.actor?.login ?? null,
      })),
    };
  }
}
