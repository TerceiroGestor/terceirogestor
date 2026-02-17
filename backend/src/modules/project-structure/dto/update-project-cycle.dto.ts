import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateProjectCycleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

