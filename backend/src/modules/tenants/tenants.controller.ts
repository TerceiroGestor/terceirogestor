import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import type { JwtUser } from '../../core/auth/strategies/jwt.strategy';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentTenant(@CurrentUser() user: JwtUser) {
    return this.tenantsService.getTenant(user.tenantId);
  }
}
