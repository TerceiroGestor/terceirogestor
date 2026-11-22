import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAttendanceEvolutionDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  notes?: string;
}
