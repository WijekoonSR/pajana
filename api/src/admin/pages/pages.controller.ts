import { Body, Get, Param, Put } from '@nestjs/common';
import type { AdminPrincipal } from '../auth/auth.types.js';
import { AdminController, CurrentAdmin } from '../auth/decorators.js';
import { PageDto } from './pages.dto.js';
import { PagesService } from './pages.service.js';

@AdminController('pages')
export class PagesController {
  constructor(private readonly pages: PagesService) {}

  @Get()
  list() {
    return this.pages.list();
  }

  @Get(':slug/:locale')
  get(@Param('slug') slug: string, @Param('locale') locale: string) {
    return this.pages.get(slug, locale);
  }

  @Put(':slug/:locale')
  save(
    @Param('slug') slug: string,
    @Param('locale') locale: string,
    @Body() dto: PageDto,
    @CurrentAdmin() admin: AdminPrincipal,
  ) {
    return this.pages.save(slug, locale, dto, admin.id);
  }
}
