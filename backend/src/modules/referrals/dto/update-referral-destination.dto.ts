import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateReferralDestinationDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  contactInfo?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  responsibleName?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
