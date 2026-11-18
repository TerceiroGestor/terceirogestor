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
import { AddOccurrencePersonDto } from './dto/add-occurrence-person.dto';
import { CreateOccurrenceDto } from './dto/create-occurrence.dto';
import { ListOccurrencesQueryDto } from './dto/list-occurrences-query.dto';
import { UpdateOccurrenceDto } from './dto/update-occurrence.dto';
import { OccurrencesService } from './occurrences.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('occurrences')
export class OccurrencesController {
  constructor(private readonly service: OccurrencesService) {}

  @Get()
  @Permissions('occurrences.read')
  async list(
    @CurrentUser() user: JwtUser,
    @Query() query: ListOccurrencesQueryDto,
  ) {
    return this.service.list(user, query);
  }

  @Post()
  @Permissions('occurrences.create')
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateOccurrenceDto) {
    return this.service.create(user, dto);
  }

  @Get(':id')
  @Permissions('occurrences.read')
  async get(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.get(user, id);
  }

  @Patch(':id')
  @Permissions('occurrences.update')
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateOccurrenceDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @Permissions('occurrences.delete')
  async delete(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.delete(user, id);
  }

  @Post(':id/people')
  @Permissions('occurrences.update')
  async addPerson(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: AddOccurrencePersonDto,
  ) {
    return this.service.addPerson(user, id, dto);
  }

  @Delete(':id/people/:linkId')
  @Permissions('occurrences.update')
  async removePerson(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('linkId', new ParseUUIDPipe({ version: '4' })) linkId: string,
  ) {
    return this.service.removePerson(user, id, linkId);
  }
}
