import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ProjectStatus } from '../../../generated/prisma';

export class CreateProjectDto {
  @IsUUID()
  programId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

