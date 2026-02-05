import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { AuthTokenPayload } from './types/auth-token-payload';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(tenantId: string, email: string, password: string) {
    const user = await this.usersService.findByEmailAndTenant(tenantId, email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.tenantId, dto.email, dto.password);

    const payload: AuthTokenPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}
