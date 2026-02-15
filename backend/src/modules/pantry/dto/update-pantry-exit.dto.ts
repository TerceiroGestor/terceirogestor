import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { PantryExitType } from '../../../generated/prisma';

export class UpdatePantryExitDto {
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @IsOptional()
  @IsUUID()
  entryId?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsDateString()
  exitDate?: string;

  @IsOptional()
  @IsEnum(PantryExitType)
  type?: PantryExitType;

  @IsOptional()
  @IsString()
  eventName?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
