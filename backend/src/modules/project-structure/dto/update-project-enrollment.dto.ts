import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { EnrollmentStatus } from '../../../generated/prisma';

export class UpdateProjectEnrollmentDto {
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @IsOptional()
  @IsDateString()
  endsAt?: string | null;
}
