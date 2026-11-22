import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AttendancePersonRole } from '../../../generated/prisma';

export class AddAttendancePersonDto {
  @IsUUID('4')
  personId!: string;

  @IsOptional()
  @IsEnum(AttendancePersonRole)
  role?: AttendancePersonRole;
}
