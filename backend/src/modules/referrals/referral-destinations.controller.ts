import {
  Body,
  Controller,
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
import { CreateReferralDestinationDto } from './dto/create-referral-destination.dto';
import { ListReferralDestinationsQueryDto } from './dto/list-referral-destinations-query.dto';
import { UpdateReferralDestinationDto } from './dto/update-referral-destination.dto';
import { ReferralDestinationsService } from './referral-destinations.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('referral-destinations')
export class ReferralDestinationsController {
  constructor(private readonly service: ReferralDestinationsService) {}

  @Get()
  @Permissions('referrals.read')
  async list(
    @CurrentUser() user: JwtUser,
    @Query() query: ListReferralDestinationsQueryDto,
  ) {
    return this.service.list(user, query);
  }

  @Post()
  @Permissions('referrals.create')
  async create(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateReferralDestinationDto,
  ) {
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
    @Body() dto: UpdateReferralDestinationDto,
  ) {
    return this.service.update(user, id, dto);
  }
}
