import { Controller, Get, Param, Query } from '@nestjs/common';
import { CastQuery, LocaleQuery, ScheduleQuery } from './public.dto.js';
import { PublicService } from './public.service.js';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('settings')
  settings(@Query() q: LocaleQuery) {
    return this.publicService.getSettings(q.locale);
  }

  @Get('pricing')
  pricing(@Query() q: LocaleQuery) {
    return this.publicService.getPricing(q.locale);
  }

  @Get('profiles')
  profiles(@Query() q: LocaleQuery) {
    return this.publicService.listProfiles(q.locale);
  }

  @Get('cast')
  cast(@Query() q: CastQuery) {
    return this.publicService.listCast(q);
  }

  @Get('profiles/:slug')
  profile(@Param('slug') slug: string, @Query() q: LocaleQuery) {
    return this.publicService.getProfile(slug, q.locale);
  }

  @Get('schedule')
  schedule(@Query() q: ScheduleQuery) {
    return this.publicService.getSchedule(q.locale, q.date, q.days);
  }

  @Get('pages/:slug')
  page(@Param('slug') slug: string, @Query() q: LocaleQuery) {
    return this.publicService.getPage(slug, q.locale);
  }
}
