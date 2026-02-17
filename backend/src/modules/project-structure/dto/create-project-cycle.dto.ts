import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateProjectCycleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

