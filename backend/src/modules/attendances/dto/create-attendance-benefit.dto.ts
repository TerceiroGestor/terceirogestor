import { IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class CreateAttendanceBenefitDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsString()
  date!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
