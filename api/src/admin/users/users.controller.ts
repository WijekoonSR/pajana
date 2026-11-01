import { Body, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import type { AdminPrincipal } from '../auth/auth.types.js';
import { AdminController, CurrentAdmin, Roles } from '../auth/decorators.js';
import { CreateUserDto, UpdateUserDto } from './users.dto.js';
import { UsersService } from './users.service.js';

@AdminController('users')
@Roles('OWNER')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list() {
    return this.users.list();
  }

  @Post()
  create(@Body() dto: CreateUserDto, @CurrentAdmin() admin: AdminPrincipal) {
    return this.users.create(dto, admin.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentAdmin() admin: AdminPrincipal,
  ) {
    return this.users.update(id, dto, admin.id);
  }
}
