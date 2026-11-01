import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  addDays,
  endsNextDay,
  isValidDate,
  tokyoDateOf,
  tokyoSlot,
  tokyoStartOfDay,
  tokyoTimeOf,
  tokyoToday,
  toTokyoIso,
} from '../../common/tokyo-time.js';
import type { ScheduleSlot } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { toLocalized } from '../admin.dto.js';
import { AuditService } from '../audit/audit.service.js';
import type { SlotDto } from './schedule.dto.js';

@Injectable()
export class ScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Every slot in the range (all statuses, all profiles) by Tokyo start date. */
  async list(from: string | undefined, days: number, profileId?: string) {
    const start = from ?? tokyoToday();
    if (!isValidDate(start)) throw new BadRequestException('Invalid date');
    const slots = await this.prisma.scheduleSlot.findMany({
      where: {
        startAt: { gte: tokyoStartOfDay(start), lt: tokyoStartOfDay(addDays(start, days)) },
        ...(profileId ? { profileId } : {}),
      },
      orderBy: [{ startAt: 'asc' }],
      include: {
        profile: { select: { id: true, slug: true, displayName: true, visibility: true } },
      },
    });
    return {
      timezone: 'Asia/Tokyo',
      today: tokyoToday(),
      from: start,
      days,
      slots: slots.map((s) => ({ ...this.toView(s), profile: s.profile })),
    };
  }

  async create(dto: SlotDto, actorId: string) {
    const data = await this.validate(dto);
    const slot = await this.prisma.scheduleSlot.create({ data });
    await this.audit.record(actorId, 'schedule.create', 'ScheduleSlot', slot.id);
    return this.toView(slot);
  }

  async update(id: string, dto: SlotDto, actorId: string) {
    await this.find(id);
    const data = await this.validate(dto, id);
    const slot = await this.prisma.scheduleSlot.update({ where: { id }, data });
    await this.audit.record(actorId, 'schedule.update', 'ScheduleSlot', id);
    return this.toView(slot);
  }

  async remove(id: string, actorId: string) {
    await this.find(id);
    await this.prisma.scheduleSlot.delete({ where: { id } });
    await this.audit.record(actorId, 'schedule.delete', 'ScheduleSlot', id);
  }

  private async find(id: string) {
    const slot = await this.prisma.scheduleSlot.findUnique({ where: { id } });
    if (!slot) throw new NotFoundException('Slot not found');
    return slot;
  }

  private async validate(dto: SlotDto, ignoreId?: string) {
    if (!isValidDate(dto.date)) throw new BadRequestException('Invalid date');
    if (dto.start === dto.end) {
      throw new BadRequestException('End time must differ from start time');
    }
    const profile = await this.prisma.profile.findUnique({ where: { id: dto.profileId } });
    if (!profile) throw new BadRequestException('Choose an existing profile');

    const { startAt, endAt } = tokyoSlot(dto.date, dto.start, dto.end);
    if (dto.status !== 'CANCELLED') {
      const clash = await this.prisma.scheduleSlot.findFirst({
        where: {
          profileId: dto.profileId,
          status: { not: 'CANCELLED' },
          startAt: { lt: endAt },
          endAt: { gt: startAt },
          ...(ignoreId ? { id: { not: ignoreId } } : {}),
        },
      });
      if (clash) {
        throw new ConflictException(
          `Overlaps another slot (${tokyoDateOf(clash.startAt)} ${tokyoTimeOf(clash.startAt)}-${tokyoTimeOf(clash.endAt)})`,
        );
      }
    }
    return {
      profileId: dto.profileId,
      startAt,
      endAt,
      status: dto.status,
      publicNote: toLocalized(dto.publicNote),
    };
  }

  private toView(s: ScheduleSlot) {
    return {
      id: s.id,
      profileId: s.profileId,
      date: tokyoDateOf(s.startAt),
      start: toTokyoIso(s.startAt),
      end: toTokyoIso(s.endAt),
      startTime: tokyoTimeOf(s.startAt),
      endTime: tokyoTimeOf(s.endAt),
      endsNextDay: endsNextDay(s.startAt, s.endAt),
      status: s.status,
      publicNote: s.publicNote,
    };
  }
}
