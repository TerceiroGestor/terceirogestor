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
import { CyclesService } from './cycles.service';
import { CreateCycleDto } from './dto/create-cycle.dto';
import { ListCyclesQueryDto } from './dto/list-cycles-query.dto';
import { UpdateCycleDto } from './dto/update-cycle.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('cycles')
export class CyclesController {
  constructor(private readonly cycles: CyclesService) {}

  @Get()
  @Permissions('project-structure.read')
  async list(@CurrentUser() user: JwtUser, @Query() query: ListCyclesQueryDto) {
    return this.cycles.listCycles(user.tenantId, query);
  }

  @Get(':id')
  @Permissions('project-structure.read')
  async get(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.cycles.getCycle(user.tenantId, id);
  }

  @Post()
  @Permissions('project-structure.create')
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateCycleDto) {
    return this.cycles.createCycle(user.tenantId, dto);
  }

  @Patch(':id')
  @Permissions('project-structure.update')
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateCycleDto,
  ) {
    return this.cycles.updateCycle(user.tenantId, id, dto);
  }

  @Delete(':id')
  @Permissions('project-structure.delete')
  async remove(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.cycles.deleteCycle(user.tenantId, id);
  }
}
