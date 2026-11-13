import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { WEEK_DAYS } from '../action-occurrence-schedule';

const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateActionOccurrenceDto {
  @IsString()
  scheduledDate!: string;

  @Matches(TIME_OF_DAY_PATTERN, {
    message: 'startTime deve estar no formato HH:mm',
  })
  startTime!: string;

  @IsOptional()
  @Matches(TIME_OF_DAY_PATTERN, {
    message: 'endTime deve estar no formato HH:mm',
  })
  endTime?: string | null;

  @IsOptional()
  @IsUUID('4')
  peopleGroupId?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class BulkCreateActionOccurrencesDto {
  @IsOptional()
  @IsUUID('4')
  peopleGroupId?: string | null;

  @IsString()
  startDate!: string;

  @IsString()
  endDate!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(WEEK_DAYS, { each: true })
  daysOfWeek!: (typeof WEEK_DAYS)[number][];

  @Matches(TIME_OF_DAY_PATTERN, {
    message: 'startTime deve estar no formato HH:mm',
  })
  startTime!: string;

  @IsOptional()
  @Matches(TIME_OF_DAY_PATTERN, {
    message: 'endTime deve estar no formato HH:mm',
  })
  endTime?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
