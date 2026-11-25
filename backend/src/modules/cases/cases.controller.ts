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
import { AddCasePersonDto } from './dto/add-case-person.dto';
import { CreateCaseDto } from './dto/create-case.dto';
import { ListCasesQueryDto } from './dto/list-cases-query.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CasesService } from './cases.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('cases')
export class CasesController {
  constructor(private readonly service: CasesService) {}

  @Get()
  @Permissions('cases.read')
  async list(@CurrentUser() user: JwtUser, @Query() query: ListCasesQueryDto) {
    return this.service.list(user, query);
  }

  @Post()
  @Permissions('cases.create')
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateCaseDto) {
    return this.service.create(user, dto);
  }

  @Get(':id')
  @Permissions('cases.read')
  async get(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.get(user, id);
  }

  @Get(':id/report')
  @Permissions('cases.read')
  async report(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.getReport(user, id);
  }

  @Patch(':id')
  @Permissions('cases.update')
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateCaseDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @Permissions('cases.delete')
  async delete(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.delete(user, id);
  }

  @Post(':id/people')
  @Permissions('cases.update')
  async addPerson(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: AddCasePersonDto,
  ) {
    return this.service.addPerson(user, id, dto);
  }

  @Delete(':id/people/:linkId')
  @Permissions('cases.update')
  async removePerson(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('linkId', new ParseUUIDPipe({ version: '4' })) linkId: string,
  ) {
    return this.service.removePerson(user, id, linkId);
  }
}
