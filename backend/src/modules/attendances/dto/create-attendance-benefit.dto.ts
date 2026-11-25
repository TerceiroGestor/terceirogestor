import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateAttendanceBenefitDto {
  @IsUUID('4')
  evolutionId!: string;

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
