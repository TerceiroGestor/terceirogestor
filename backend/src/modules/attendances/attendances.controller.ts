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
import { AddAttendancePersonDto } from './dto/add-attendance-person.dto';
import { CreateAttendanceBenefitDto } from './dto/create-attendance-benefit.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { CreateAttendanceEvolutionDto } from './dto/create-attendance-evolution.dto';
import { ListAttendancesQueryDto } from './dto/list-attendances-query.dto';
import { UpdateAttendanceBenefitDto } from './dto/update-attendance-benefit.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { UpdateAttendanceEvolutionDto } from './dto/update-attendance-evolution.dto';
import { AttendancesService } from './attendances.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('attendances')
export class AttendancesController {
  constructor(private readonly service: AttendancesService) {}

  @Get()
  @Permissions('attendances.read')
  async list(
    @CurrentUser() user: JwtUser,
    @Query() query: ListAttendancesQueryDto,
  ) {
    return this.service.list(user, query);
  }

  @Post()
  @Permissions('attendances.create')
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateAttendanceDto) {
    return this.service.create(user, dto);
  }

  @Get(':id')
  @Permissions('attendances.read')
  async get(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.get(user, id);
  }

  @Patch(':id')
  @Permissions('attendances.update')
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @Permissions('attendances.delete')
  async delete(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.delete(user, id);
  }

  @Post(':id/people')
  @Permissions('attendances.update')
  async addPerson(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: AddAttendancePersonDto,
  ) {
    return this.service.addPerson(user, id, dto);
  }

  @Delete(':id/people/:linkId')
  @Permissions('attendances.update')
  async removePerson(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('linkId', new ParseUUIDPipe({ version: '4' })) linkId: string,
  ) {
    return this.service.removePerson(user, id, linkId);
  }

  @Post(':id/evolutions')
  @Permissions('attendances.update')
  async addEvolution(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreateAttendanceEvolutionDto,
  ) {
    return this.service.addEvolution(user, id, dto);
  }

  @Patch(':id/evolutions/:evolutionId')
  @Permissions('attendances.update')
  async updateEvolution(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('evolutionId', new ParseUUIDPipe({ version: '4' }))
    evolutionId: string,
    @Body() dto: UpdateAttendanceEvolutionDto,
  ) {
    return this.service.updateEvolution(user, id, evolutionId, dto);
  }

  @Delete(':id/evolutions/:evolutionId')
  @Permissions('attendances.update')
  async removeEvolution(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('evolutionId', new ParseUUIDPipe({ version: '4' }))
    evolutionId: string,
  ) {
    return this.service.removeEvolution(user, id, evolutionId);
  }

  @Post(':id/benefits')
  @Permissions('attendances.update')
  async addBenefit(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreateAttendanceBenefitDto,
  ) {
    return this.service.addBenefit(user, id, dto);
  }

  @Patch(':id/benefits/:benefitId')
  @Permissions('attendances.update')
  async updateBenefit(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('benefitId', new ParseUUIDPipe({ version: '4' })) benefitId: string,
    @Body() dto: UpdateAttendanceBenefitDto,
  ) {
    return this.service.updateBenefit(user, id, benefitId, dto);
  }

  @Delete(':id/benefits/:benefitId')
  @Permissions('attendances.update')
  async removeBenefit(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('benefitId', new ParseUUIDPipe({ version: '4' })) benefitId: string,
  ) {
    return this.service.removeBenefit(user, id, benefitId);
  }
}
