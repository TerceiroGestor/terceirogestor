import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { OccurrenceCaseStatus } from '../../../generated/prisma';

export class UpdateOccurrenceDto {
  @IsOptional()
  @IsUUID('4')
  meetingId?: string | null;

  @IsOptional()
  @IsUUID('4')
  caseId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string | null;

  @IsOptional()
  @IsEnum(OccurrenceCaseStatus)
  status?: OccurrenceCaseStatus;

  @IsOptional()
  @IsString()
  outcomeNotes?: string | null;
}
