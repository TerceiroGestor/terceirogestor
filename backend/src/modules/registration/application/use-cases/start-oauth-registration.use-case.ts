import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { normalizeTenantSlug } from '../../domain/policies/registration-slug.policy';
import { RegistrationOAuthClient, type RegistrationOAuthProvider } from '../../infrastructure/integrations/registration-oauth.client';
import { RegistrationRepository } from '../../infrastructure/repositories/registration.repository';
import { slugify } from '../../registration.utils';

@Injectable()
export class StartOAuthRegistrationUseCase {
  constructor(
    private readonly registrationRepository: RegistrationRepository,
    private readonly registrationOAuthClient: RegistrationOAuthClient,
  ) {}

  async execute(provider: RegistrationOAuthProvider, tenantName: string) {
    const cleanName = tenantName.trim();
    await this.ensureTenantNameIsFree(cleanName);
    const tenantSlug = normalizeTenantSlug(slugify(cleanName));

    const stateSecret = randomBytes(16).toString('base64url');
    const stateHash = createHash('sha256').update(stateSecret).digest('hex');

    const method = provider === 'google' ? 'GOOGLE' : 'MICROSOFT';
    const registration =
      await this.registrationRepository.createPendingOAuthRegistration({
        method,
        tenantName: cleanName,
        tenantSlug,
        oauthStateHash: stateHash,
      });

    const state = `${registration.id}.${stateSecret}`;
    const redirectUrl = this.registrationOAuthClient.buildAuthorizeUrl(
      provider,
      state,
    );

    return { redirectUrl };
  }

  private async ensureTenantNameIsFree(name: string) {
    const existing = await this.registrationRepository.findTenantByName(name);
    if (existing) {
      throw new BadRequestException('Ja existe uma instituicao com esse nome');
    }
  }
}