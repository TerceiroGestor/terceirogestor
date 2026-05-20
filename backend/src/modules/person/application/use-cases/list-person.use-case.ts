import { Injectable } from '@nestjs/common';
import {
  buildPaginationMeta,
  resolvePagination,
} from '../../../../core/utils/pagination';
import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from '../../domain/constants/person.constants';
import {
  buildPersonOrderBy,
  buildPersonWhere,
  parseAdvancedFilters,
  parseGrouping,
} from '../queries/person-list.query';
import { mapPerson } from '../mappers/person-response.mapper';
import type { ListPersonInput } from '../types/person-crud.input';
import { PersonRepository } from '../../infrastructure/repositories/person.repository';

@Injectable()
export class ListPersonUseCase {
  constructor(private readonly personRepository: PersonRepository) {}

  async execute(tenantId: string, input: ListPersonInput) {
    const { page, limit, skip, take, isAll } = resolvePagination({
      page: input.page,
      limit: input.limit,
      all: input.all,
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
    });

    const filters = parseAdvancedFilters(input.filters);
    const grouping = parseGrouping(input.groupBy);
    const where = buildPersonWhere({
      tenantId,
      query: input.q,
      filters,
    });
    const orderBy = buildPersonOrderBy(grouping);

    const [data, total] = await Promise.all([
      this.personRepository.findManyWithHealthCounts({
        where,
        orderBy,
        skip: isAll ? undefined : skip,
        take: isAll ? undefined : take,
      }),
      this.personRepository.count(where),
    ]);

    return {
      data: data.map(mapPerson),
      pagination: buildPaginationMeta({
        page,
        limit,
        total,
        isAll,
      }),
    };
  }
}