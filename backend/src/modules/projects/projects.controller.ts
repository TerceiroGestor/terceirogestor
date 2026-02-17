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
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @Permissions('projects.read')
  async list(@CurrentUser() user: JwtUser, @Query() query: ListProjectsQueryDto) {
    return this.projects.listProjects(user.tenantId, query);
  }

  @Get(':id')
  @Permissions('projects.read')
  async get(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.projects.getProject(user.tenantId, id);
  }

  @Post()
  @Permissions('projects.create')
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateProjectDto) {
    return this.projects.createProject(user.tenantId, dto);
  }

  @Patch(':id')
  @Permissions('projects.update')
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.updateProject(user.tenantId, id, dto);
  }

  @Delete(':id')
  @Permissions('projects.delete')
  async remove(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.projects.deleteProject(user.tenantId, id);
  }
}

