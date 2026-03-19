import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateProjectCycleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID('4')
  segmentId?: string;

  @IsOptional()
  @IsUUID('4')
  catalogCycleId?: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;
}

