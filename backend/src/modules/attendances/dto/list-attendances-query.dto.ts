import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  AttendanceCaseStatus,
  AttendanceType,
} from '../../../generated/prisma';

export class ListAttendancesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsEnum(AttendanceType)
  type?: AttendanceType;

  @IsOptional()
  @IsEnum(AttendanceCaseStatus)
  status?: AttendanceCaseStatus;

  @IsOptional()
  @IsUUID('4')
  professionalId?: string;

  @IsOptional()
  @IsUUID('4')
  occurrenceId?: string;

  @IsOptional()
  @IsUUID('4')
  caseId?: string;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === '1' || value === true)
  all?: boolean;
}
