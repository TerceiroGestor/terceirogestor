import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ActionPeopleParticipationRole } from '../../../generated/prisma';

export class CreateProjectTeamParticipationDto {
  @IsUUID('4')
  personId!: string;

  @IsOptional()
  @IsEnum(ActionPeopleParticipationRole)
  role?: ActionPeopleParticipationRole;

  @IsOptional()
  @IsString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string | null;
}
