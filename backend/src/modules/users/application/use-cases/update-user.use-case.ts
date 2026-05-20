import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { Prisma } from '../../../generated/prisma';
import type { UpdateUserInput } from '../types/user-crud.input';
import { UsersRepository } from '../../infrastructure/repositories/users.repository';
import { GetUserProfileUseCase } from './get-user-profile.use-case';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
  ) {}

  async execute(tenantId: string, userId: string, input: UpdateUserInput) {
    const existing = await this.usersRepository.findWithRolesById(tenantId, userId);
    if (!existing) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.avatarUrl !== undefined) {
      updateData.avatarUrl = input.avatarUrl.trim() ? input.avatarUrl : null;
    }
    if (input.password) {
      updateData.passwordHash = await bcrypt.hash(input.password, 10);
    }

    await this.usersRepository.update(userId, updateData);

    if (input.roleIds) {
      const roleIds = (await this.usersRepository.findRoleIds(tenantId, input.roleIds)).map(
        (role) => role.id,
      );
      await this.usersRepository.syncUserRoles(tenantId, userId, roleIds);
    }

    return this.getUserProfileUseCase.execute(tenantId, userId);
  }
}