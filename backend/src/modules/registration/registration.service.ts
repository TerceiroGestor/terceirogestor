import { Injectable } from '@nestjs/common';
import { ConfirmRegistrationUseCase } from './application/use-cases/confirm-registration.use-case';
import { GetRegistrationUseCase } from './application/use-cases/get-registration.use-case';
import { HandleOAuthRegistrationCallbackUseCase } from './application/use-cases/handle-oauth-registration-callback.use-case';
import { RequestEmailRegistrationUseCase } from './application/use-cases/request-email-registration.use-case';
import { StartOAuthRegistrationUseCase } from './application/use-cases/start-oauth-registration.use-case';
import { RequestTenantRegistrationDto } from './dto/request-tenant-registration.dto';
import { ConfirmTenantRegistrationDto } from './dto/confirm-tenant-registration.dto';
import type { RegistrationOAuthProvider } from './infrastructure/integrations/registration-oauth.client';

@Injectable()
export class RegistrationService {
  constructor(
    private readonly requestEmailRegistrationUseCase: RequestEmailRegistrationUseCase,
    private readonly getRegistrationUseCase: GetRegistrationUseCase,
    private readonly confirmRegistrationUseCase: ConfirmRegistrationUseCase,
    private readonly startOAuthRegistrationUseCase: StartOAuthRegistrationUseCase,
    private readonly handleOAuthRegistrationCallbackUseCase: HandleOAuthRegistrationCallbackUseCase,
  ) {}

  async requestEmailRegistration(dto: RequestTenantRegistrationDto) {
    return this.requestEmailRegistrationUseCase.execute(dto);
  }

  async getRegistration(registrationId: string) {
    return this.getRegistrationUseCase.execute(registrationId);
  }

  async confirmRegistration(
    dto: ConfirmTenantRegistrationDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    return this.confirmRegistrationUseCase.execute(dto, meta);
  }

  async startOAuth(provider: RegistrationOAuthProvider, tenantName: string) {
    return this.startOAuthRegistrationUseCase.execute(provider, tenantName);
  }

  async handleOAuthCallback(
    provider: RegistrationOAuthProvider,
    params: { code?: string; state?: string; error?: string },
  ) {
    return this.handleOAuthRegistrationCallbackUseCase.execute(provider, params);
  }
}
