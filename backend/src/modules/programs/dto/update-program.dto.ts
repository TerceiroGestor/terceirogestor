import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ProgramStatus, ProgramType } from '../../../generated/prisma';

export class UpdateProgramDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ProgramType)
  type?: ProgramType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProgramStatus)
  status?: ProgramStatus;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

