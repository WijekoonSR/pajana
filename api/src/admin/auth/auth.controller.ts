import { Body, Get, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ChangePasswordDto, LoginDto } from './auth.dto.js';
import { AuthService } from './auth.service.js';
import type { AdminPrincipal } from './auth.types.js';
import { AdminController, CurrentAdmin, Public } from './decorators.js';

@AdminController('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    // The admin panel calls the API server-to-server and forwards the visitor IP.
    const forwarded = req.headers['x-admin-client-ip'];
    const ip = (typeof forwarded === 'string' && forwarded) || req.ip || 'unknown';
    return this.auth.login(dto.login, dto.password, ip);
  }

  @Get('me')
  me(@CurrentAdmin() admin: AdminPrincipal) {
    return { id: admin.id, login: admin.login, role: admin.role };
  }

  @Post('logout')
  @HttpCode(204)
  logout(@CurrentAdmin() admin: AdminPrincipal) {
    return this.auth.logout(admin);
  }

  @Post('password')
  @HttpCode(204)
  changePassword(@CurrentAdmin() admin: AdminPrincipal, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(admin, dto.currentPassword, dto.newPassword);
  }
}
