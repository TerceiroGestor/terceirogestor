import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../core/dto/pagination-query.dto';

export class ListPersonQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  filters?: string;

  @IsOptional()
  @IsString()
  groupBy?: string;
}

/**
 * @deprecated Alias legado mantido apenas para compatibilidade temporaria durante a migracao para `person`.
 */
export { ListPersonQueryDto as ListPeopleQueryDto };
