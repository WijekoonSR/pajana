import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AdminRole } from '../../generated/prisma/enums.js';
import { AuthService } from './auth.service.js';
import { IS_PUBLIC, ROLES } from './decorators.js';

/** Requires a valid bearer session on every admin route unless marked @Public(). */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;

    const req = ctx.switchToHttp().getRequest<Request & { admin?: unknown }>();
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    const admin = token ? await this.auth.resolveSession(token) : null;
    if (!admin) throw new UnauthorizedException('Not signed in');
    req.admin = admin;

    const roles = this.reflector.getAllAndOverride<AdminRole[] | undefined>(ROLES, targets);
    if (roles && !roles.includes(admin.role)) {
      throw new ForbiddenException('Not allowed for your role');
    }
    return true;
  }
}
