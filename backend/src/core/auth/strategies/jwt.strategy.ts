import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthTokenPayload } from '../types/auth-token-payload';

export type JwtUser = {
  userId: string;
  tenantId: string;
  email: string;
  name?: string | null;
  tenantName?: string | null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: AuthTokenPayload): Promise<JwtUser> {
    if (!payload?.sub || !payload.tenantId) {
      throw new UnauthorizedException('Token invalido');
    }

    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      email: payload.email,
      name: payload.name ?? null,
      tenantName: payload.tenantName ?? null,
    };
  }
}

