import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { LocalizedDto, LocalizedType } from '../admin.dto.js';

export const CHANNEL_TYPES = ['phone', 'sms', 'email', 'line', 'whatsapp', 'telegram'] as const;
export const NAV_KEYS = ['top', 'system', 'schedule', 'cast', 'access', 'recruit', 'contact'] as const;

const HTTPS = /^https:\/\/[^\s]+$/;

export class BannerDto {
  @IsString()
  @MaxLength(300)
  path: string;

  @ValidateNested()
  @LocalizedType()
  alt: LocalizedDto;
}

export class HighlightDto {
  @ValidateNested()
  @LocalizedType()
  title: LocalizedDto;

  @ValidateNested()
  @LocalizedType()
  body: LocalizedDto;
}

export class ChannelDto {
  @IsIn(CHANNEL_TYPES)
  type: (typeof CHANNEL_TYPES)[number];

  @ValidateNested()
  @LocalizedType()
  label: LocalizedDto;

  @IsString()
  @MaxLength(200)
  value: string;

  // Only links the site can safely render (no javascript: or data: URLs).
  @Matches(/^(tel:\+?[\d-]+|sms:\+?[\d-]+|mailto:[^\s@]+@[^\s@]+|https:\/\/[^\s]+)$/, {
    message: 'Contact link must start with tel:, sms:, mailto: or https://',
  })
  href: string;
}

export class SocialLinkDto {
  @IsString()
  @MaxLength(60)
  label: string;

  @Matches(HTTPS, { message: 'Social links must be https:// URLs' })
  url: string;
}

export class NavItemDto {
  @IsIn(NAV_KEYS)
  key: (typeof NAV_KEYS)[number];

  @IsBoolean()
  visible: boolean;
}

export class AgeGateDto {
  @ValidateNested()
  @LocalizedType()
  title: LocalizedDto;

  @ValidateNested()
  @LocalizedType()
  body: LocalizedDto;

  @ValidateNested()
  @LocalizedType()
  enterLabel: LocalizedDto;

  @ValidateNested()
  @LocalizedType()
  leaveLabel: LocalizedDto;

  @Matches(HTTPS, { message: 'Leave URL must be an https:// URL' })
  leaveUrl: string;
}

export class SettingsDto {
  @ValidateNested()
  @LocalizedType()
  siteTitle: LocalizedDto;

  @ValidateNested()
  @LocalizedType()
  tagline: LocalizedDto;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  logoPath?: string | null;

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => BannerDto)
  heroBanners: BannerDto[];

  @ValidateNested()
  @LocalizedType()
  homeIntro: LocalizedDto;

  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => HighlightDto)
  highlights: HighlightDto[];

  @ValidateNested()
  @LocalizedType()
  businessHours: LocalizedDto;

  @ValidateNested()
  @LocalizedType()
  serviceArea: LocalizedDto;

  @IsOptional()
  @Matches(HTTPS, { message: 'Map link must be an https:// URL' })
  mapUrl?: string | null;

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ChannelDto)
  contactChannels: ChannelDto[];

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socialLinks: SocialLinkDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NavItemDto)
  navigation: NavItemDto[];

  @ValidateNested()
  @Type(() => AgeGateDto)
  ageGate: AgeGateDto;

  @ValidateNested()
  @LocalizedType()
  pricingFootnote: LocalizedDto;
}
