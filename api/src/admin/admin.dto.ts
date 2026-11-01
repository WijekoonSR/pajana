import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** One text value per locale. Missing locales fall back to English publicly. */
export class LocalizedDto {
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  en?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  'zh-TW'?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  'zh-CN'?: string;
}

/** Nested localized field helper: @ValidateNested + @Type in one place. */
export const LocalizedType = () => Type(() => LocalizedDto);

export class ReorderDto {
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('all', { each: true })
  ids: string[];
}

/** Normalizes a LocalizedDto into the stored JSON shape (trimmed, all locales present). */
export function toLocalized(value: LocalizedDto | undefined) {
  return {
    en: value?.en?.trim() ?? '',
    'zh-TW': value?.['zh-TW']?.trim() ?? '',
    'zh-CN': value?.['zh-CN']?.trim() ?? '',
  };
}

export class IdParam {
  @IsString()
  id: string;
}
