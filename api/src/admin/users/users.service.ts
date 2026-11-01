import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { hashPassword } from '../auth/password.js';
import type { CreateUserDto, UpdateUserDto } from './users.dto.js';

const PUBLIC_FIELDS = {
  id: true,
  login: true,
  role: true,
  status: true,
  lastLoginAt: true,
  lockedUntil: true,
  createdAt: true,
} as const;

/** Admin accounts. There is no public registration; owners create accounts here. */
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.prisma.adminUser.findMany({ select: PUBLIC_FIELDS, orderBy: { createdAt: 'asc' } });
  }

  async create(dto: CreateUserDto, actorId: string) {
    const login = dto.login.trim().toLowerCase();
    if (await this.prisma.adminUser.findUnique({ where: { login } })) {
      throw new ConflictException('That login is already taken');
    }
    const user = await this.prisma.adminUser.create({
      data: { login, role: dto.role, passwordHash: await hashPassword(dto.password) },
      select: PUBLIC_FIELDS,
    });
    await this.audit.record(actorId, 'user.create', 'AdminUser', user.id);
    return user;
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const losesOwner =
      user.role === 'OWNER' &&
      user.status === 'ACTIVE' &&
      ((dto.role && dto.role !== 'OWNER') || dto.status === 'DISABLED');
    if (losesOwner) {
      if (id === actorId) throw new BadRequestException('You cannot demote or disable yourself');
      const owners = await this.prisma.adminUser.count({
        where: { role: 'OWNER', status: 'ACTIVE' },
      });
      if (owners <= 1) throw new BadRequestException('At least one active owner is required');
    }

    const updated = await this.prisma.adminUser.update({
      where: { id },
      data: {
        role: dto.role,
        status: dto.status,
        ...(dto.password
          ? { passwordHash: await hashPassword(dto.password), failedLogins: 0, lockedUntil: null }
          : {}),
      },
      select: PUBLIC_FIELDS,
    });
    // Disabling or resetting a password ends the user's sessions.
    if (dto.status === 'DISABLED' || dto.password) {
      await this.prisma.adminSession.deleteMany({ where: { userId: id } });
    }
    const action = dto.password ? 'user.password_reset' : 'user.update';
    await this.audit.record(actorId, action, 'AdminUser', id);
    return updated;
  }
}
