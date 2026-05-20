import { Injectable, NotFoundException } from '@nestjs/common';
import { mapUserProfile } from '../mappers/user-response.mapper';
import { UsersRepository } from '../../infrastructure/repositories/users.repository';

@Injectable()
export class GetUserProfileUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(tenantId: string, userId: string) {
    const user = await this.usersRepository.findWithRolesById(tenantId, userId);
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    const permissions = await this.usersRepository.findPermissionKeysForRoles(
      tenantId,
      user.roles.map((entry) => entry.role.id),
    );

    return mapUserProfile(user, permissions);
  }
}