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
import { CreateProjectEnrollmentDto } from './dto/create-project-enrollment.dto';
import { CreateProjectPeopleGroupDto } from './dto/create-project-people-group.dto';
import { ListEligibleProjectPeopleQueryDto } from './dto/list-eligible-project-people-query.dto';
import { ListProjectEnrollmentsQueryDto } from './dto/list-project-enrollments-query.dto';
import { ListProjectPeopleGroupsQueryDto } from './dto/list-project-people-groups-query.dto';
import { SyncPeopleGroupEnrollmentsDto } from './dto/sync-people-group-enrollments.dto';
import { UpdateProjectEnrollmentDto } from './dto/update-project-enrollment.dto';
import { ProjectStructureService } from './project-structure.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('projects')
export class ProjectStructureController {
  constructor(private readonly service: ProjectStructureService) {}

  @Get(':projectId/people-groups')
  @Permissions('project-structure.read')
  async listPeopleGroups(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Query() query: ListProjectPeopleGroupsQueryDto,
  ) {
    return this.service.listPeopleGroups(user.tenantId, projectId, query);
  }

  @Post(':projectId/people-groups')
  @Permissions('project-structure.create')
  async createPeopleGroup(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Body() dto: CreateProjectPeopleGroupDto,
  ) {
    return this.service.createPeopleGroup(user.tenantId, projectId, dto);
  }

  @Delete(':projectId/people-groups/:projectPeopleGroupId')
  @Permissions('project-structure.delete')
  async deletePeopleGroup(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('projectPeopleGroupId', new ParseUUIDPipe({ version: '4' }))
    projectPeopleGroupId: string,
  ) {
    return this.service.deletePeopleGroup(
      user.tenantId,
      projectId,
      projectPeopleGroupId,
    );
  }

  @Post(':projectId/people-groups/:peopleGroupId/sync-enrollments')
  @Permissions('enrollments.create')
  async syncPeopleGroupEnrollments(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('peopleGroupId', new ParseUUIDPipe({ version: '4' }))
    peopleGroupId: string,
    @Body() dto: SyncPeopleGroupEnrollmentsDto,
  ) {
    return this.service.syncPeopleGroupEnrollments(
      user.tenantId,
      projectId,
      peopleGroupId,
      dto,
    );
  }

  @Get(':projectId/enrollments')
  @Permissions('enrollments.read')
  async listEnrollments(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Query() query: ListProjectEnrollmentsQueryDto,
  ) {
    return this.service.listEnrollments(user.tenantId, projectId, query);
  }

  @Get(':projectId/eligible-people')
  @Permissions('enrollments.read')
  async listEligiblePeople(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Query() query: ListEligibleProjectPeopleQueryDto,
  ) {
    return this.service.listEligiblePeople(user.tenantId, projectId, query);
  }

  @Post(':projectId/enrollments')
  @Permissions('enrollments.create')
  async createEnrollment(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Body() dto: CreateProjectEnrollmentDto,
  ) {
    return this.service.createEnrollment(user.tenantId, projectId, dto);
  }

  @Patch(':projectId/enrollments/:enrollmentId')
  @Permissions('enrollments.update')
  async updateEnrollment(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('enrollmentId', new ParseUUIDPipe({ version: '4' }))
    enrollmentId: string,
    @Body() dto: UpdateProjectEnrollmentDto,
  ) {
    return this.service.updateEnrollment(
      user.tenantId,
      projectId,
      enrollmentId,
      dto,
    );
  }

  @Delete(':projectId/enrollments/:enrollmentId')
  @Permissions('enrollments.delete')
  async deleteEnrollment(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('enrollmentId', new ParseUUIDPipe({ version: '4' }))
    enrollmentId: string,
  ) {
    return this.service.deleteEnrollment(
      user.tenantId,
      projectId,
      enrollmentId,
    );
  }
}
