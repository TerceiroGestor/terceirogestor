import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ProjectStatus } from '../../../generated/prisma';

export class UpdateProjectDto {
  @IsOptional()
  @IsUUID()
  programId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

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

