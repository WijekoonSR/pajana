import {
  applyDecorators,
  Controller,
  createParamDecorator,
  SetMetadata,
  UseGuards,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AdminRole } from '../../generated/prisma/enums.js';
import type { AdminPrincipal } from './auth.types.js';
import { AdminAuthGuard } from './auth.guard.js';

export const IS_PUBLIC = 'admin:public';
export const ROLES = 'admin:roles';

/** Skips the admin session check (login only). */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Restricts a route to the given roles (CMS-01 role restrictions). */
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES, roles);

export const CurrentAdmin = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AdminPrincipal =>
    (ctx.switchToHttp().getRequest<Request>() as Request & { admin: AdminPrincipal }).admin,
);

/** Controller under /api/admin/<path>, protected by the admin session guard. */
export const AdminController = (path: string) =>
  applyDecorators(Controller(`admin/${path}`), UseGuards(AdminAuthGuard));
