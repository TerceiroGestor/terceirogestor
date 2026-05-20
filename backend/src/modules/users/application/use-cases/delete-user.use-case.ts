import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/repositories/users.repository';

@Injectable()
export class DeleteUserUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(tenantId: string, userId: string) {
    const existing = await this.usersRepository.findByIdAndTenant(
      tenantId,
      userId,
    );
    if (!existing) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    await this.usersRepository.deleteCascade(tenantId, userId);
    return { ok: true };
  }
}