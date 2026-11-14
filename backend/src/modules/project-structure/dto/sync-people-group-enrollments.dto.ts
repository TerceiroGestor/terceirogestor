import { IsEnum, IsOptional } from 'class-validator';
import { ProjectParticipationRole } from '../../../generated/prisma';

export class SyncPeopleGroupEnrollmentsDto {
  @IsOptional()
  @IsEnum(ProjectParticipationRole)
  role?: ProjectParticipationRole;
}
