import { Module } from '@nestjs/common';
import { AuditController } from './audit/audit.controller.js';
import { AuditService } from './audit/audit.service.js';
import { AdminAuthGuard } from './auth/auth.guard.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { DashboardController } from './dashboard/dashboard.controller.js';
import { MediaController } from './media/media.controller.js';
import { MediaService } from './media/media.service.js';
import { PagesController } from './pages/pages.controller.js';
import { PagesService } from './pages/pages.service.js';
import { PricingController } from './pricing/pricing.controller.js';
import { PricingService } from './pricing/pricing.service.js';
import { ProfilesController } from './profiles/profiles.controller.js';
import { ProfilesService } from './profiles/profiles.service.js';
import { ScheduleController } from './schedule/schedule.controller.js';
import { ScheduleService } from './schedule/schedule.service.js';
import { SettingsController } from './settings/settings.controller.js';
import { SettingsService } from './settings/settings.service.js';
import { UsersController } from './users/users.controller.js';
import { UsersService } from './users/users.service.js';

/** CMS / admin API under /api/admin (SRS section 04). */
@Module({
  controllers: [
    AuthController,
    DashboardController,
    ProfilesController,
    MediaController,
    ScheduleController,
    PricingController,
    PagesController,
    SettingsController,
    UsersController,
    AuditController,
  ],
  providers: [
    AdminAuthGuard,
    AuditService,
    AuthService,
    MediaService,
    PagesService,
    PricingService,
    ProfilesService,
    ScheduleService,
    SettingsService,
    UsersService,
  ],
})
export class AdminModule {}
