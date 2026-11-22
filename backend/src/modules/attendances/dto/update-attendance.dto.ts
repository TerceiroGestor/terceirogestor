import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  AttendanceCaseStatus,
  AttendanceType,
} from '../../../generated/prisma';

export class UpdateAttendanceDto {
  @IsOptional()
  @IsEnum(AttendanceType)
  type?: AttendanceType;

  @IsOptional()
  @IsString()
  scheduledDate?: string;

  @IsOptional()
  @IsUUID('4')
  professionalId?: string;

  @IsOptional()
  @IsUUID('4')
  occurrenceId?: string | null;

  @IsOptional()
  @IsEnum(AttendanceCaseStatus)
  status?: AttendanceCaseStatus;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsString()
  closingNotes?: string | null;
}
