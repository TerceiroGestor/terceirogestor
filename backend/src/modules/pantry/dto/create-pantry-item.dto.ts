import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePantryItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  group?: string;

  @IsString()
  unit: string;

  @Type(() => Number)
  @IsNumber()
  minStock: number;
}
