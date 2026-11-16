import { IsOptional, Matches } from 'class-validator';

export class PersonAttendanceSummaryQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month deve estar no formato AAAA-MM' })
  month?: string;
}
