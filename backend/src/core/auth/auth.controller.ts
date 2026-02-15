import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import type { JwtUser } from './strategies/jwt.strategy';
import {
  getCookie,
  getCookieOptions,
  getRequestMeta,
  REFRESH_COOKIE_NAME,
} from './http/auth-http';
import { TRUSTED_DEVICE_COOKIE_NAME } from './mfa/mfa.constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const requestTenantId = (req as Request & { tenantId?: string }).tenantId;
    const payload: LoginDto = { ...dto, tenantId: dto.tenantId ?? requestTenantId };
    const trustedDeviceToken = getCookie(req, TRUSTED_DEVICE_COOKIE_NAME);
    const result = await this.authService.loginWithMeta(
      payload,
      getRequestMeta(req),
      requestTenantId,
      trustedDeviceToken,
    );

    if (result.mfaRequired) {
      return result;
    }

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());
    return { accessToken: result.accessToken };
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = getCookie(req, REFRESH_COOKIE_NAME);
    if (!refreshToken) {
      return { accessToken: null };
    }
    const requestTenantId = (req as Request & { tenantId?: string }).tenantId;
    const { accessToken, refreshToken: nextRefresh } =
      await this.authService.refresh(
        refreshToken,
        getRequestMeta(req),
        requestTenantId,
      );
    res.cookie(REFRESH_COOKIE_NAME, nextRefresh, getCookieOptions());
    return { accessToken };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: JwtUser,
  ) {
    const refreshToken = getCookie(req, REFRESH_COOKIE_NAME);
    await this.authService.logout(refreshToken, user, getRequestMeta(req));
    res.cookie(REFRESH_COOKIE_NAME, '', { ...getCookieOptions(), maxAge: 0 });
    return { ok: true };
  }

  @Get('access-logs')
  @UseGuards(JwtAuthGuard)
  async getAccessLogs(
    @CurrentUser() user: JwtUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('search') search?: string,
  ) {
    return this.authService.getAccessLogs(user, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      action: action ? (action as 'LOGIN' | 'REFRESH' | 'LOGOUT') : undefined,
      search,
    });
  }
}
