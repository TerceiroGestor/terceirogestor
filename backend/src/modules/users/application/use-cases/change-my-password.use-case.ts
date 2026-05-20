import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../../infrastructure/repositories/users.repository';

@Injectable()
export class ChangeMyPasswordUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(
    tenantId: string,
    userId: string,
    dto: { currentPassword: string; newPassword: string },
  ) {
    const user = await this.usersRepository.findActiveCredentials(
      tenantId,
      userId,
    );
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Senha atual inválida');
    }

    const now = new Date();
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.usersRepository.updatePasswordAndRevokeSessions(
      tenantId,
      userId,
      passwordHash,
      now,
    );

    return { ok: true };
  }
}