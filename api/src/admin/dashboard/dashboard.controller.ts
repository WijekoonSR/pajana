import { Get } from '@nestjs/common';
import { tokyoStartOfDay, tokyoToday, addDays } from '../../common/tokyo-time.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AdminController } from '../auth/decorators.js';

@AdminController('dashboard')
export class DashboardController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  async summary() {
    const today = tokyoToday();
    const [byVisibility, todaySlots, draftPages, mediaCount, recent] =
      await Promise.all([
        this.prisma.profile.groupBy({ by: ['visibility'], _count: true }),
        this.prisma.scheduleSlot.count({
          where: {
            status: 'SCHEDULED',
            startAt: { gte: tokyoStartOfDay(today), lt: tokyoStartOfDay(addDays(today, 1)) },
            profile: { visibility: 'PUBLISHED' },
          },
        }),
        this.prisma.contentPage.count({ where: { status: 'DRAFT' } }),
        this.prisma.mediaAsset.count(),
        this.audit.list(1, 8),
      ]);
    return {
      today,
      profiles: Object.fromEntries(byVisibility.map((v) => [v.visibility, v._count])),
      todaySlots,
      draftPages,
      mediaCount,
      recentActivity: recent.entries,
    };
  }
}
