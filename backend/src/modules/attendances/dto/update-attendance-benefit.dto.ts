import { IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class UpdateAttendanceBenefitDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
