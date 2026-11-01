import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  Max,
  Min,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ProfileVisibility } from '../../generated/prisma/enums.js';
import { LocalizedDto, LocalizedType } from '../admin.dto.js';

export const PROFILE_TABS = ['active', 'published', 'draft', 'hidden', 'archived'] as const;
export type ProfileTab = (typeof PROFILE_TABS)[number];

export class ProfileListQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;

  @IsOptional()
  @IsIn(PROFILE_TABS)
  status: ProfileTab = 'active';

  /** Matches the slug or the display name in any language. */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;
}

export class MoveDto {
  @IsIn(['up', 'down'])
  direction: 'up' | 'down';
}

export class AttributeDto {
  @ValidateNested()
  @LocalizedType()
  label: LocalizedDto;

  @ValidateNested()
  @LocalizedType()
  value: LocalizedDto;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug may use lowercase letters, numbers and single hyphens',
  })
  slug?: string;

  @IsOptional()
  @ValidateNested()
  @LocalizedType()
  displayName?: LocalizedDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AttributeDto)
  attributes?: AttributeDto[];

  @IsOptional()
  @ValidateNested()
  @LocalizedType()
  bio?: LocalizedDto;

  @IsOptional()
  @ValidateNested()
  @LocalizedType()
  comment?: LocalizedDto;

  @IsOptional()
  @IsEnum(ProfileVisibility)
  visibility?: ProfileVisibility;

  @IsOptional()
  @IsBoolean()
  isNew?: boolean;
}

export class CreateProfileDto extends UpdateProfileDto {
  declare slug: string;
  declare displayName: LocalizedDto;
}

export class AddProfileMediaDto {
  @IsUUID()
  assetId: string;

  @IsOptional()
  @ValidateNested()
  @LocalizedType()
  altText?: LocalizedDto;
}

export class UpdateProfileMediaDto {
  @IsOptional()
  @ValidateNested()
  @LocalizedType()
  altText?: LocalizedDto;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
