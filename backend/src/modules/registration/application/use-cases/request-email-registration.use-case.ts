import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { EmailService } from '../../../core/email/email.service';
import { buildTenantRegistrationCodeEmail } from '../../../core/email/templates/tenant-registration-code';
import { REGISTRATION_CODE_TTL_MINUTES } from '../../registration.constants';
import { RequestTenantRegistrationDto } from '../../dto/request-tenant-registration.dto';
import { normalizeTenantSlug } from '../../domain/policies/registration-slug.policy';
import { RegistrationRepository } from '../../infrastructure/repositories/registration.repository';
import { slugify } from '../../registration.utils';

@Injectable()
export class RequestEmailRegistrationUseCase {
  constructor(
    private readonly registrationRepository: RegistrationRepository,
    private readonly email: EmailService,
  ) {}

  async execute(dto: RequestTenantRegistrationDto) {
    const tenantName = dto.tenantName.trim();
    const tenantSlug = normalizeTenantSlug(
      dto.tenantSlug ?? slugify(tenantName),
    );
    await this.ensureTenantNameIsFree(tenantName);

    const passwordHash = await bcrypt.hash(dto.adminPassword, 10);
    const { code, codeHash, expiresAt } = await this.buildVerificationCode();

    const registration =
      await this.registrationRepository.createPendingEmailRegistration({
        tenantName,
        tenantSlug,
        adminName: dto.adminName.trim(),
        adminEmail: dto.adminEmail.trim().toLowerCase(),
        adminPasswordHash: passwordHash,
        verificationCodeHash: codeHash,
        verificationCodeExpiresAt: expiresAt,
      });

    await this.sendCodeEmail(dto.adminEmail, tenantName, code);

    return { registrationId: registration.id };
  }

  private async ensureTenantNameIsFree(name: string) {
    const existing = await this.registrationRepository.findTenantByName(name);
    if (existing) {
      throw new BadRequestException('Ja existe uma instituicao com esse nome');
    }
  }

  private async buildVerificationCode() {
    const code = String(randomInt(0, 1000000)).padStart(6, '0');
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(
      Date.now() + REGISTRATION_CODE_TTL_MINUTES * 60 * 1000,
    );
    return { code, codeHash, expiresAt };
  }

  private async sendCodeEmail(to: string, tenantName: string, code: string) {
    const message = buildTenantRegistrationCodeEmail({
      tenantName,
      code,
      expiresMinutes: REGISTRATION_CODE_TTL_MINUTES,
    });
    await this.email.send({ to, ...message });
  }
}