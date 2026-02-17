import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { EnrollmentStatus } from '../../../generated/prisma';

export class CreateProjectEnrollmentDto {
  @IsUUID('4')
  personId: string;

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
