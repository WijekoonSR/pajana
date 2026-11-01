import {
  Body,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type { AdminPrincipal } from '../auth/auth.types.js';
import { AdminController, CurrentAdmin } from '../auth/decorators.js';
import { ScheduleRangeQuery, SlotDto } from './schedule.dto.js';
import { ScheduleService } from './schedule.service.js';

@AdminController('schedule')
export class ScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  @Get()
  list(@Query() q: ScheduleRangeQuery) {
    return this.schedule.list(q.from, q.days, q.profileId);
  }

  @Post()
  create(@Body() dto: SlotDto, @CurrentAdmin() admin: AdminPrincipal) {
    return this.schedule.create(dto, admin.id);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SlotDto,
    @CurrentAdmin() admin: AdminPrincipal,
  ) {
    return this.schedule.update(id, dto, admin.id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentAdmin() admin: AdminPrincipal) {
    return this.schedule.remove(id, admin.id);
  }
}
