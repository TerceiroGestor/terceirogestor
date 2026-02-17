import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class ListProjectEnrollmentsQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID('4')
  groupId?: string;

  @IsOptional()
  @IsUUID('4')
  cycleId?: string;

  @IsOptional()
  @IsUUID('4')
  excludeGroupId?: string;

  @IsOptional()
  @IsUUID('4')
  excludeCycleId?: string;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
