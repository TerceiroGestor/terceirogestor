import { IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { OccurrenceStatus } from '../../../generated/prisma';

const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class UpdateActionOccurrenceDto {
  @IsOptional()
  @IsString()
  scheduledDate?: string;

  @IsOptional()
  @Matches(TIME_OF_DAY_PATTERN, {
    message: 'startTime deve estar no formato HH:mm',
  })
  startTime?: string;

  @IsOptional()
  @Matches(TIME_OF_DAY_PATTERN, {
    message: 'endTime deve estar no formato HH:mm',
  })
  endTime?: string | null;

  @IsOptional()
  @IsUUID('4')
  peopleGroupId?: string | null;

  @IsOptional()
  @IsEnum(OccurrenceStatus)
  status?: OccurrenceStatus;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class UpdateActionOccurrenceBatchDto {
  @IsEnum(OccurrenceStatus)
  status!: OccurrenceStatus;

  @IsOptional()
  @IsString()
  fromDate?: string;
}
