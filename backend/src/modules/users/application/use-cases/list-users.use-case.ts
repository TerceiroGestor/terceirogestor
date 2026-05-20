import { Injectable } from '@nestjs/common';
import { mapUserListItem } from '../mappers/user-response.mapper';
import type { ListUsersInput } from '../types/user-crud.input';
import { UsersRepository } from '../../infrastructure/repositories/users.repository';

@Injectable()
export class ListUsersUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(tenantId: string, input: ListUsersInput) {
    const page = input.page && input.page > 0 ? input.page : 1;
    const limit =
      input.limit && input.limit > 0 ? Math.min(input.limit, 200) : 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.usersRepository.findPage(tenantId, {
      skip,
      take: limit,
      search: input.search,
    });

    return {
      data: data.map(mapUserListItem),
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}