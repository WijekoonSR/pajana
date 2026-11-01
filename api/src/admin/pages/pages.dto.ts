import { IsEnum, IsString, MaxLength } from 'class-validator';
import { PageStatus } from '../../generated/prisma/enums.js';

export class PageDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(50000)
  body: string;

  @IsString()
  @MaxLength(200)
  seoTitle: string;

  @IsString()
  @MaxLength(320)
  metaDescription: string;

  @IsEnum(PageStatus)
  status: PageStatus;
}
