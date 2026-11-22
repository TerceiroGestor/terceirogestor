import { ArrayMaxSize, ArrayMinSize, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ActionPeopleParticipationRole } from '../../../generated/prisma';

export class AddMeetingTeamParticipationDto {
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  personIds!: string[];

  @IsOptional()
  @IsEnum(ActionPeopleParticipationRole)
  role?: ActionPeopleParticipationRole;
}
