import { Injectable, NotFoundException } from '@nestjs/common';
import { RegistrationRepository } from '../../infrastructure/repositories/registration.repository';

@Injectable()
export class GetRegistrationUseCase {
  constructor(private readonly registrationRepository: RegistrationRepository) {}

  async execute(registrationId: string) {
    const reg = await this.registrationRepository.findRegistrationById(
      registrationId,
    );
    if (!reg) {
      throw new NotFoundException('Registro nao encontrado');
    }

    return {
      id: reg.id,
      method: reg.method,
      status: reg.status,
      tenantName: reg.tenantName,
      tenantSlug: reg.tenantSlug,
      adminEmail: reg.adminEmail,
      adminName: reg.adminName,
      passwordRequired: !reg.adminPasswordHash,
      codeExpiresAt: reg.verificationCodeExpiresAt,
    };
  }
}