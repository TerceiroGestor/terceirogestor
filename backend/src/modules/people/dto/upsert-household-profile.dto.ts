import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpsertHouseholdProfileDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsString()
  ownership?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  areaM2?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bathrooms?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
