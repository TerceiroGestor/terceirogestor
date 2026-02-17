import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import type { JwtUser } from '../../core/auth/strategies/jwt.strategy';
import { Permissions } from '../../core/authorization/permissions.decorator';
import { PermissionsGuard } from '../../core/authorization/permissions.guard';
import { ActionsService } from './actions.service';
import { CreateProjectActionDto } from './dto/create-project-action.dto';
import { ListProjectActionAttendancesQueryDto } from './dto/list-project-action-attendances-query.dto';
import { ListProjectActionsQueryDto } from './dto/list-project-actions-query.dto';
import { UpdateProjectActionDto } from './dto/update-project-action.dto';
import { UpsertProjectActionAttendancesDto } from './dto/upsert-project-action-attendances.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('projects')
export class ProjectActionsController {
  constructor(private readonly service: ActionsService) {}

  @Get(':projectId/actions')
  @Permissions('actions.read')
  async list(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Query() query: ListProjectActionsQueryDto,
  ) {
    return this.service.listProjectActions(user, projectId, query);
  }

  @Post(':projectId/actions')
  @Permissions('actions.create')
  async create(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Body() dto: CreateProjectActionDto,
  ) {
    return this.service.createProjectAction(user, projectId, dto);
  }

  @Get(':projectId/actions/:actionId')
  @Permissions('actions.read')
  async get(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
  ) {
    return this.service.getProjectAction(user, projectId, actionId);
  }

  @Patch(':projectId/actions/:actionId')
  @Permissions('actions.update')
  async update(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Body() dto: UpdateProjectActionDto,
  ) {
    return this.service.updateProjectAction(user, projectId, actionId, dto);
  }

  @Delete(':projectId/actions/:actionId')
  @Permissions('actions.delete')
  async remove(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
  ) {
    return this.service.deleteProjectAction(user, projectId, actionId);
  }

  @Get(':projectId/actions/:actionId/attendances')
  @Permissions('actions.read')
  async listAttendances(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Query() query: ListProjectActionAttendancesQueryDto,
  ) {
    return this.service.listProjectActionAttendances(
      user,
      projectId,
      actionId,
      query,
    );
  }

  @Put(':projectId/actions/:actionId/attendances')
  @Permissions('actions.update')
  async upsertAttendances(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Body() dto: UpsertProjectActionAttendancesDto,
  ) {
    return this.service.upsertProjectActionAttendances(
      user,
      projectId,
      actionId,
      dto,
    );
  }
}
