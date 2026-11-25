import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  AttendanceCaseStatus,
  AttendanceType,
} from '../../../generated/prisma';

export class CreateAttendanceDto {
  @IsEnum(AttendanceType)
  type!: AttendanceType;

  @IsString()
  scheduledDate!: string;

  @IsUUID('4')
  professionalId!: string;

  @IsOptional()
  @IsUUID('4')
  occurrenceId?: string | null;

  @IsOptional()
  @IsUUID('4')
  caseId?: string | null;

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
