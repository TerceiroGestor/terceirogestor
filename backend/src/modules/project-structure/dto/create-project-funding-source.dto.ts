import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FundingSourceType } from '../../../generated/prisma';

export class CreateProjectFundingSourceDto {
  @IsEnum(FundingSourceType)
  source: FundingSourceType;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
