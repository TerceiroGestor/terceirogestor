import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateCycleCommentDto {
  @IsString()
  body!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentionUserIds?: string[];
}
