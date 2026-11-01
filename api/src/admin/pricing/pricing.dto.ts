import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { LocalizedDto, LocalizedType } from '../admin.dto.js';

// Must match web/src/lib/admin/currencies.ts. No automatic conversion (SRS 07).
export const CURRENCIES = ['JPY', 'USD', 'TWD', 'CNY', 'HKD', 'EUR', 'GBP', 'KRW', 'SGD', 'AUD', 'THB'];

export class CategoryDto {
  @ValidateNested()
  @LocalizedType()
  title: LocalizedDto;

  @IsOptional()
  @ValidateNested()
  @LocalizedType()
  note?: LocalizedDto;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class EntryDto {
  @IsUUID()
  categoryId: string;

  @ValidateNested()
  @LocalizedType()
  serviceLabel: LocalizedDto;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24 * 60)
  durationMinutes?: number | null;

  @IsInt()
  @Min(0)
  @Max(100_000_000)
  amount: number;

  @IsIn(CURRENCIES, { message: 'Choose a currency from the list' })
  currency: string;

  @IsOptional()
  @ValidateNested()
  @LocalizedType()
  description?: LocalizedDto;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
