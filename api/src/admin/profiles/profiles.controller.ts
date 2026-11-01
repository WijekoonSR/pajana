import {
  Body,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ReorderDto } from '../admin.dto.js';
import type { AdminPrincipal } from '../auth/auth.types.js';
import { AdminController, CurrentAdmin } from '../auth/decorators.js';
import {
  AddProfileMediaDto,
  CreateProfileDto,
  MoveDto,
  ProfileListQuery,
  UpdateProfileDto,
  UpdateProfileMediaDto,
} from './profiles.dto.js';
import { ProfilesService } from './profiles.service.js';

@AdminController('profiles')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get()
  list(@Query() q: ProfileListQuery) {
    return this.profiles.page(q);
  }

  /** Full list for pickers; declared before :id. */
  @Get('options')
  options() {
    return this.profiles.options();
  }

  @Post()
  create(@Body() dto: CreateProfileDto, @CurrentAdmin() admin: AdminPrincipal) {
    return this.profiles.create(dto, admin.id);
  }

  @Post('reorder')
  reorder(@Body() dto: ReorderDto, @CurrentAdmin() admin: AdminPrincipal) {
    return this.profiles.reorder(dto.ids, admin.id);
  }

  @Post(':id/move')
  @HttpCode(204)
  move(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoveDto,
    @CurrentAdmin() admin: AdminPrincipal,
  ) {
    return this.profiles.move(id, dto.direction, admin.id);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.profiles.get(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProfileDto,
    @CurrentAdmin() admin: AdminPrincipal,
  ) {
    return this.profiles.update(id, dto, admin.id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentAdmin() admin: AdminPrincipal) {
    return this.profiles.remove(id, admin.id);
  }

  @Post(':id/media')
  addMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddProfileMediaDto,
    @CurrentAdmin() admin: AdminPrincipal,
  ) {
    return this.profiles.addMedia(id, dto, admin.id);
  }

  @Post(':id/media/reorder')
  reorderMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReorderDto,
    @CurrentAdmin() admin: AdminPrincipal,
  ) {
    return this.profiles.reorderMedia(id, dto.ids, admin.id);
  }

  @Patch(':id/media/:mediaId')
  updateMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
    @Body() dto: UpdateProfileMediaDto,
    @CurrentAdmin() admin: AdminPrincipal,
  ) {
    return this.profiles.updateMedia(id, mediaId, dto, admin.id);
  }

  @Delete(':id/media/:mediaId')
  removeMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
    @CurrentAdmin() admin: AdminPrincipal,
  ) {
    return this.profiles.removeMedia(id, mediaId, admin.id);
  }
}
