import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ScheduleStatus } from '../../generated/prisma/enums.js';
import { LocalizedDto, LocalizedType } from '../admin.dto.js';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export class ScheduleRangeQuery {
  @IsOptional()
  @Matches(DATE, { message: 'from must be YYYY-MM-DD' })
  from?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(42)
  days: number = 7;

  /** Only this profile's slots (month calendar per cast). */
  @IsOptional()
  @IsUUID()
  profileId?: string;
}

/** A slot as entered in the CMS: Tokyo date + wall-clock start/end. */
export class SlotDto {
  @IsUUID()
  profileId: string;

  @Matches(DATE, { message: 'Date must be YYYY-MM-DD' })
  date: string;

  @Matches(TIME, { message: 'Start time must be HH:mm' })
  start: string;

  @Matches(TIME, { message: 'End time must be HH:mm' })
  end: string;

  @IsEnum(ScheduleStatus)
  status: ScheduleStatus;

  @IsOptional()
  @ValidateNested()
  @LocalizedType()
  publicNote?: LocalizedDto;
}
