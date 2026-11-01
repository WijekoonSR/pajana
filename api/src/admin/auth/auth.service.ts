import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { AdminPrincipal } from './auth.types.js';
import { DUMMY_HASH, hashPassword, verifyPassword } from './password.js';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;
const IP_WINDOW_MS = 15 * 60 * 1000;
const IP_MAX_ATTEMPTS = 20;

// One message for unknown login, wrong password, disabled and locked accounts,
// so responses never reveal whether an account exists (SRS 06).
const INVALID = 'Invalid login or password';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  /** Failed attempts per client IP (in memory; single API instance). */
  private readonly ipFailures = new Map<string, number[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async login(loginInput: string, password: string, ip: string) {
    this.checkIpThrottle(ip);
    const login = loginInput.trim().toLowerCase();
    const user = await this.prisma.adminUser.findUnique({ where: { login } });

    const passwordOk = await verifyPassword(password, user?.passwordHash ?? (await DUMMY_HASH));
    const locked = !!user?.lockedUntil && user.lockedUntil > new Date();

    if (!user || !passwordOk || locked || user.status !== 'ACTIVE') {
      this.noteIpFailure(ip);
      if (user && !locked) {
        const failedLogins = user.failedLogins + 1;
        await this.prisma.adminUser.update({
          where: { id: user.id },
          data:
            failedLogins >= MAX_FAILURES
              ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MS) }
              : { failedLogins },
        });
        if (failedLogins >= MAX_FAILURES) {
          await this.audit.record(user.id, 'auth.locked', 'AdminUser', user.id);
        }
      }
      throw new UnauthorizedException(INVALID);
    }

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const [session] = await this.prisma.$transaction([
      this.prisma.adminSession.create({
        data: { tokenHash: sha256(token), userId: user.id, expiresAt },
      }),
      this.prisma.adminUser.update({
        where: { id: user.id },
        data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
      }),
      // Housekeeping: drop expired sessions.
      this.prisma.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    ]);
    this.ipFailures.delete(ip);
    await this.audit.record(user.id, 'auth.login', 'AdminSession', session.id);
    return {
      token,
      expiresAt: expiresAt.toISOString(),
      user: { id: user.id, login: user.login, role: user.role },
    };
  }

  async resolveSession(token: string): Promise<AdminPrincipal | null> {
    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash: sha256(token) },
      include: { user: true },
    });
    if (!session || session.expiresAt <= new Date() || session.user.status !== 'ACTIVE') {
      return null;
    }
    return {
      id: session.user.id,
      login: session.user.login,
      role: session.user.role,
      sessionId: session.id,
    };
  }

  async logout(admin: AdminPrincipal) {
    await this.prisma.adminSession.deleteMany({ where: { id: admin.sessionId } });
    await this.audit.record(admin.id, 'auth.logout', 'AdminSession', admin.sessionId);
  }

  async changePassword(admin: AdminPrincipal, current: string, next: string) {
    const user = await this.prisma.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
    if (!(await verifyPassword(current, user.passwordHash))) {
      throw new BadRequestException('Current password is incorrect');
    }
    await this.prisma.$transaction([
      this.prisma.adminUser.update({
        where: { id: admin.id },
        data: { passwordHash: await hashPassword(next) },
      }),
      // Sign out other devices.
      this.prisma.adminSession.deleteMany({
        where: { userId: admin.id, id: { not: admin.sessionId } },
      }),
    ]);
    await this.audit.record(admin.id, 'auth.password_change', 'AdminUser', admin.id);
  }

  private recentIpFailures(ip: string) {
    const cutoff = Date.now() - IP_WINDOW_MS;
    const recent = (this.ipFailures.get(ip) ?? []).filter((t) => t > cutoff);
    this.ipFailures.set(ip, recent);
    return recent;
  }

  private checkIpThrottle(ip: string) {
    if (this.recentIpFailures(ip).length >= IP_MAX_ATTEMPTS) {
      throw new HttpException(
        'Too many failed sign-in attempts. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private noteIpFailure(ip: string) {
    this.recentIpFailures(ip).push(Date.now());
  }
}
