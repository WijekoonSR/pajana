import { Body, Get, Put } from '@nestjs/common';
import type { AdminPrincipal } from '../auth/auth.types.js';
import { AdminController, CurrentAdmin } from '../auth/decorators.js';
import { SettingsDto } from './settings.dto.js';
import { SettingsService } from './settings.service.js';

@AdminController('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get() {
    return this.settings.get();
  }

  @Put()
  save(@Body() dto: SettingsDto, @CurrentAdmin() admin: AdminPrincipal) {
    return this.settings.save(dto, admin.id);
  }
}
