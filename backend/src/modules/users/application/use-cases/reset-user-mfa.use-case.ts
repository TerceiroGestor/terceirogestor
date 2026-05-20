import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/repositories/users.repository';
import { GetUserProfileUseCase } from './get-user-profile.use-case';

@Injectable()
export class ResetUserMfaUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
  ) {}

  async execute(tenantId: string, userId: string) {
    const existing = await this.usersRepository.ensureExistsByTenant(
      tenantId,
      userId,
    );
    if (!existing) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    await this.usersRepository.resetMfa(tenantId, userId, new Date());
    return this.getUserProfileUseCase.execute(tenantId, userId);
  }
}