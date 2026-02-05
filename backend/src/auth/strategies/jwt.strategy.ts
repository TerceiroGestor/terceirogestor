import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthTokenPayload } from '../types/auth-token-payload';

export type JwtUser = {
  userId: string;
  tenantId: string;
  email: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: AuthTokenPayload): Promise<JwtUser> {
    if (!payload?.sub || !payload.tenantId) {
      throw new UnauthorizedException('Token inválido');
    }

    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      email: payload.email,
    };
  }
}
