import { IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { AdminRole, AdminStatus } from '../../generated/prisma/enums.js';

export class CreateUserDto {
  @IsString()
  @MaxLength(254)
  @Matches(/^[a-zA-Z0-9._@+-]{3,254}$/, {
    message: 'Login may use letters, numbers and . _ @ + - (3 or more characters)',
  })
  login: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(200)
  password: string;

  @IsEnum(AdminRole)
  role: AdminRole;
}

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;

  @IsOptional()
  @IsEnum(AdminStatus)
  status?: AdminStatus;

  /** Owner-initiated password reset (CMS-01 "approved method"). */
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(200)
  password?: string;
}
