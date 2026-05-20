import { ForbiddenException, Injectable } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/repositories/users.repository';

@Injectable()
export class ListMentionableUsersUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(
    tenantId: string,
    currentUserId: string,
    permissionKey: string,
    search?: string,
  ) {
    const normalizedPermission = permissionKey.trim();
    if (!normalizedPermission) {
      throw new ForbiddenException('Permissao invalida para mencoes');
    }

    const currentUserPermissions =
      await this.usersRepository.findPermissionKeysForUser(
        tenantId,
        currentUserId,
      );

    if (!currentUserPermissions.includes(normalizedPermission)) {
      throw new ForbiddenException(
        'Voce nao pode listar mencoes para este modulo',
      );
    }

    const users = await this.usersRepository.findMentionableUsers(
      tenantId,
      normalizedPermission,
      search,
    );

    return users.map((user) => ({
      id: user.id,
      name: user.name?.trim() || user.email,
      email: user.email,
      avatarUrl: user.avatarUrl,
    }));
  }
}