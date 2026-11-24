import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ActionPeopleParticipationRole } from '../../../generated/prisma';
import { WEEK_DAYS } from '../action-occurrence-schedule';

const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * "Responsáveis" na criação do Encontro (revisão da estrutura de
 * Projetos, 2026-11-24) - evita um passo extra depois pra adicionar quem
 * vai conduzir o Encontro (`MeetingTeamParticipation`).
 */
export class MeetingTeamParticipantInputDto {
  @IsUUID('4')
  personId!: string;

  @IsOptional()
  @IsEnum(ActionPeopleParticipationRole)
  role?: ActionPeopleParticipationRole;
}

export class CreateActionOccurrenceDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string | null;

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
  @IsArray()
  @IsUUID('4', { each: true })
  peopleGroupIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  teamPeopleGroupIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeetingTeamParticipantInputDto)
  teamParticipants?: MeetingTeamParticipantInputDto[];

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
  photoPaths?: string[];
}

export class PreviewActionOccurrencesDto {
  @IsString()
  startDate!: string;

  @IsString()
  endDate!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(WEEK_DAYS, { each: true })
  daysOfWeek!: (typeof WEEK_DAYS)[number][];
}

export class BulkCreateActionOccurrencesDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  peopleGroupIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  teamPeopleGroupIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeetingTeamParticipantInputDto)
  teamParticipants?: MeetingTeamParticipantInputDto[];

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
  photoPaths?: string[];

  /** Datas (feriados/pontos facultativos) removidas no preview, excluidas da geracao. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedDates?: string[];
}
