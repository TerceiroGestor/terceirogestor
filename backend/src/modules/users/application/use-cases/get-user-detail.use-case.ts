import { Injectable, NotFoundException } from '@nestjs/common';
import { mapUserDetail } from '../mappers/user-response.mapper';
import { UsersRepository } from '../../infrastructure/repositories/users.repository';

@Injectable()
export class GetUserDetailUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(tenantId: string, userId: string) {
    const user = await this.usersRepository.findWithRolesById(tenantId, userId);
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    return mapUserDetail(user);
  }
}