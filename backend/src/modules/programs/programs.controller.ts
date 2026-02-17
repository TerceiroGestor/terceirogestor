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
import { CreateProgramDto } from './dto/create-program.dto';
import { ListProgramsQueryDto } from './dto/list-programs-query.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { ProgramsService } from './programs.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('programs')
export class ProgramsController {
  constructor(private readonly programs: ProgramsService) {}

  @Get()
  @Permissions('programs.read')
  async list(@CurrentUser() user: JwtUser, @Query() query: ListProgramsQueryDto) {
    return this.programs.listPrograms(user.tenantId, query);
  }

  @Get(':id')
  @Permissions('programs.read')
  async get(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.programs.getProgram(user.tenantId, id);
  }

  @Post()
  @Permissions('programs.create')
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateProgramDto) {
    return this.programs.createProgram(user.tenantId, dto);
  }

  @Patch(':id')
  @Permissions('programs.update')
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateProgramDto,
  ) {
    return this.programs.updateProgram(user.tenantId, id, dto);
  }

  @Delete(':id')
  @Permissions('programs.delete')
  async remove(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.programs.deleteProgram(user.tenantId, id);
  }
}

