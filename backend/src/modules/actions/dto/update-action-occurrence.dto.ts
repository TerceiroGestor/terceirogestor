import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { OccurrenceStatus } from '../../../generated/prisma';

const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class UpdateActionOccurrenceDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string | null;

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
  @IsArray()
  @IsUUID('4', { each: true })
  peopleGroupIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  teamPeopleGroupIds?: string[];

  @IsOptional()
  @IsEnum(OccurrenceStatus)
  status?: OccurrenceStatus;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsString()
  planHtml?: string | null;

  @IsOptional()
  @IsString()
  executedHtml?: string | null;

  @IsOptional()
  @IsString()
  conclusionHtml?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  photoPaths?: string[] | null;
}

export class UpdateActionOccurrenceBatchDto {
  @IsEnum(OccurrenceStatus)
  status!: OccurrenceStatus;

  @IsOptional()
  @IsString()
  fromDate?: string;
}
