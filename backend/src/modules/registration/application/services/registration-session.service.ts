import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import { AuthTokenPayload } from '../../../core/auth/types/auth-token-payload';
import { RegistrationRepository } from '../../infrastructure/repositories/registration.repository';

@Injectable()
export class RegistrationSessionService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly registrationRepository: RegistrationRepository,
  ) {}

  async issueTokensForUser(
    userId: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const user = await this.registrationRepository.findUserAuthContext(userId);
    if (!user || !user.isActive) {
      throw new BadRequestException('Usuario invalido');
    }

    const payload: AuthTokenPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      tenantSlug: user.tenant?.slug ?? null,
      email: user.email,
      name: user.name ?? null,
      tenantName: user.tenant?.name ?? null,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    await this.registrationRepository.createSessionAndLogLogin({
      tenantId: user.tenantId,
      userId: user.id,
      tokenHash,
      expiresAt,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return { accessToken, refreshToken };
  }
}