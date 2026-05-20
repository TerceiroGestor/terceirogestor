import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/repositories/users.repository';
import { GetUserProfileUseCase } from './get-user-profile.use-case';

@Injectable()
export class UpdateMyProfileUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
  ) {}

  async execute(
    tenantId: string,
    userId: string,
    dto: { name?: string; phone?: string; bio?: string; avatarUrl?: string },
  ) {
    const existing = await this.usersRepository.ensureExistsByTenant(
      tenantId,
      userId,
    );
    if (!existing) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    await this.usersRepository.updateProfile(userId, dto);
    return this.getUserProfileUseCase.execute(tenantId, userId);
  }
}