import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import type { JwtUser } from '../../core/auth/strategies/jwt.strategy';
import { Permissions } from '../../core/authorization/permissions.decorator';
import { PermissionsGuard } from '../../core/authorization/permissions.guard';
import { CreateReferralAttachmentDto } from './dto/create-referral-attachment.dto';
import { CreateReferralDto } from './dto/create-referral.dto';
import { ListReferralsQueryDto } from './dto/list-referrals-query.dto';
import { UpdateReferralDto } from './dto/update-referral.dto';
import { ReferralsService } from './referrals.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly service: ReferralsService) {}

  @Get()
  @Permissions('referrals.read')
  async list(
    @CurrentUser() user: JwtUser,
    @Query() query: ListReferralsQueryDto,
  ) {
    return this.service.list(user, query);
  }

  // Precisa vir antes de GET :id - senão "dashboard" cai no ParseUUIDPipe
  // do id (mesmo cuidado já tomado em deposit.controller.ts/summary+dashboard).
  @Get('dashboard')
  @Permissions('referrals.read')
  async dashboard(@CurrentUser() user: JwtUser) {
    return this.service.getDashboard(user);
  }

  @Post()
  @Permissions('referrals.create')
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateReferralDto) {
    return this.service.create(user, dto);
  }

  @Get(':id')
  @Permissions('referrals.read')
  async get(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.get(user, id);
  }

  @Patch(':id')
  @Permissions('referrals.update')
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateReferralDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @Permissions('referrals.delete')
  async delete(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.delete(user, id);
  }

  @Post(':id/attachments')
  @Permissions('referrals.update')
  async addAttachment(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreateReferralAttachmentDto,
  ) {
    return this.service.addAttachment(user, id, dto);
  }

  @Delete(':id/attachments/:attachmentId')
  @Permissions('referrals.update')
  async deleteAttachment(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('attachmentId', new ParseUUIDPipe({ version: '4' }))
    attachmentId: string,
  ) {
    return this.service.deleteAttachment(user, id, attachmentId);
  }
}
