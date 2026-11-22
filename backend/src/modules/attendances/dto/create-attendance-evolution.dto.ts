import { IsString, MaxLength } from 'class-validator';

export class CreateAttendanceEvolutionDto {
  @IsString()
  date!: string;

  @IsString()
  @MaxLength(8000)
  notes!: string;
}
