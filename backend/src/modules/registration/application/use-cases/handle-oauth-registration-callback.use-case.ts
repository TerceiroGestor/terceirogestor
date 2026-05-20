import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash, randomInt } from 'crypto';
import { EmailService } from '../../../core/email/email.service';
import { buildTenantRegistrationCodeEmail } from '../../../core/email/templates/tenant-registration-code';
import { REGISTRATION_CODE_TTL_MINUTES } from '../../registration.constants';
import { RegistrationOAuthClient, type RegistrationOAuthProvider } from '../../infrastructure/integrations/registration-oauth.client';
import { RegistrationRepository } from '../../infrastructure/repositories/registration.repository';

@Injectable()
export class HandleOAuthRegistrationCallbackUseCase {
  constructor(
    private readonly registrationRepository: RegistrationRepository,
    private readonly registrationOAuthClient: RegistrationOAuthClient,
    private readonly email: EmailService,
  ) {}

  async execute(
    provider: RegistrationOAuthProvider,
    params: { code?: string; state?: string; error?: string },
  ) {
    if (params.error) {
      throw new BadRequestException(params.error);
    }
    const code = params.code?.trim();
    const state = params.state?.trim();
    if (!code || !state) {
      throw new BadRequestException('Callback invalido');
    }

    const [registrationId, stateSecret] = state.split('.', 2);
    if (!registrationId || !stateSecret) {
      throw new BadRequestException('State invalido');
    }

    const reg = await this.registrationRepository.findRegistrationById(
      registrationId,
    );
    if (!reg || reg.status !== 'PENDING_OAUTH' || !reg.oauthStateHash) {
      throw new NotFoundException('Registro nao encontrado');
    }
    if (createHash('sha256').update(stateSecret).digest('hex') !== reg.oauthStateHash) {
      throw new BadRequestException('State invalido');
    }

    const profile = await this.registrationOAuthClient.fetchProfile(
      provider,
      code,
    );
    const { code: verifyCode, codeHash, expiresAt } =
      await this.buildVerificationCode();

    await this.registrationRepository.updateRegistration(reg.id, {
      status: 'PENDING_VERIFICATION',
      adminEmail: profile.email,
      adminName: profile.name,
      oauthProviderSub: profile.sub,
      verificationCodeHash: codeHash,
      verificationCodeExpiresAt: expiresAt,
    });

    await this.sendCodeEmail(profile.email, reg.tenantName, verifyCode);
    return { registrationId: reg.id };
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