import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { Prisma } from '../../../generated/prisma';
import type { CreateUserInput } from '../types/user-crud.input';
import { UsersRepository } from '../../infrastructure/repositories/users.repository';
import { GetUserProfileUseCase } from './get-user-profile.use-case';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
  ) {}

  async execute(tenantId: string, input: CreateUserInput) {
    const passwordHash = await bcrypt.hash(input.password, 10);
    const createData: Prisma.UserUncheckedCreateInput = {
      tenantId,
      name: input.name,
      email: input.email,
      passwordHash,
      isActive: input.isActive ?? true,
      ...(input.avatarUrl !== undefined
        ? { avatarUrl: input.avatarUrl.trim() ? input.avatarUrl : null }
        : {}),
    };

    const user = await this.usersRepository.create(tenantId, createData);
    const roleIds = (await this.usersRepository.findRoleIds(tenantId, input.roleIds)).map(
      (role) => role.id,
    );

    if (roleIds.length) {
      await this.usersRepository.syncUserRoles(tenantId, user.id, roleIds);
    }

    return this.getUserProfileUseCase.execute(tenantId, user.id);
  }
}