import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PantryDonorType } from '../../../../generated/prisma';

export class UpdatePantryDonorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(PantryDonorType)
  type?: PantryDonorType;

  @IsOptional()
  @IsString()
  contact?: string;
}
