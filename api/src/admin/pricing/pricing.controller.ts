import {
  Body,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ReorderDto } from '../admin.dto.js';
import type { AdminPrincipal } from '../auth/auth.types.js';
import { AdminController, CurrentAdmin } from '../auth/decorators.js';
import { CategoryDto, EntryDto } from './pricing.dto.js';
import { PricingService } from './pricing.service.js';

@AdminController('pricing')
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Get()
  list() {
    return this.pricing.list();
  }

  @Post('categories')
  createCategory(@Body() dto: CategoryDto, @CurrentAdmin() admin: AdminPrincipal) {
    return this.pricing.createCategory(dto, admin.id);
  }

  @Post('categories/reorder')
  reorderCategories(@Body() dto: ReorderDto, @CurrentAdmin() admin: AdminPrincipal) {
    return this.pricing.reorderCategories(dto.ids, admin.id);
  }

  @Put('categories/:id')
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CategoryDto,
    @CurrentAdmin() admin: AdminPrincipal,
  ) {
    return this.pricing.updateCategory(id, dto, admin.id);
  }

  @Delete('categories/:id')
  @HttpCode(204)
  removeCategory(@Param('id', ParseUUIDPipe) id: string, @CurrentAdmin() admin: AdminPrincipal) {
    return this.pricing.removeCategory(id, admin.id);
  }

  @Post('categories/:id/entries/reorder')
  reorderEntries(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReorderDto,
    @CurrentAdmin() admin: AdminPrincipal,
  ) {
    return this.pricing.reorderEntries(id, dto.ids, admin.id);
  }

  @Post('entries')
  createEntry(@Body() dto: EntryDto, @CurrentAdmin() admin: AdminPrincipal) {
    return this.pricing.createEntry(dto, admin.id);
  }

  @Put('entries/:id')
  updateEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EntryDto,
    @CurrentAdmin() admin: AdminPrincipal,
  ) {
    return this.pricing.updateEntry(id, dto, admin.id);
  }

  @Delete('entries/:id')
  @HttpCode(204)
  removeEntry(@Param('id', ParseUUIDPipe) id: string, @CurrentAdmin() admin: AdminPrincipal) {
    return this.pricing.removeEntry(id, admin.id);
  }
}
