import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { OccurrencePersonRole } from '../../../generated/prisma';

export class AddOccurrencePersonDto {
  @IsUUID('4')
  personId!: string;

  @IsOptional()
  @IsEnum(OccurrencePersonRole)
  role?: OccurrencePersonRole;
}
