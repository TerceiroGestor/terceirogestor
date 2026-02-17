import { IsOptional, IsUUID } from 'class-validator';

export class SetEnrollmentCycleDto {
  @IsOptional()
  @IsUUID('4')
  cycleId: string | null;
}
