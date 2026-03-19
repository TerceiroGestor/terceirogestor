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
import { CreateProjectCycleDto } from './dto/create-project-cycle.dto';
import { CreateProjectEnrollmentDto } from './dto/create-project-enrollment.dto';
import { CreateProjectGroupDto } from './dto/create-project-group.dto';
import { CreateProjectPeopleGroupDto } from './dto/create-project-people-group.dto';
import { AddEnrollmentGroupDto } from './dto/add-enrollment-group.dto';
import { ListEligibleProjectPeopleQueryDto } from './dto/list-eligible-project-people-query.dto';
import { ListProjectEnrollmentsQueryDto } from './dto/list-project-enrollments-query.dto';
import { ListProjectPeopleGroupsQueryDto } from './dto/list-project-people-groups-query.dto';
import { SetEnrollmentCycleDto } from './dto/set-enrollment-cycle.dto';
import { UpdateProjectCycleDto } from './dto/update-project-cycle.dto';
import { UpdateProjectEnrollmentDto } from './dto/update-project-enrollment.dto';
import { UpdateProjectGroupDto } from './dto/update-project-group.dto';
import { ProjectStructureService } from './project-structure.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('projects')
export class ProjectStructureController {
  constructor(private readonly service: ProjectStructureService) {}

  @Get(':projectId/groups')
  @Permissions('project-structure.read')
  async listGroups(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
  ) {
    return this.service.listGroups(user.tenantId, projectId);
  }

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
    return this.service.deletePeopleGroup(user.tenantId, projectId, projectPeopleGroupId);
  }

  @Post(':projectId/groups')
  @Permissions('project-structure.create')
  async createGroup(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Body() dto: CreateProjectGroupDto,
  ) {
    return this.service.createGroup(user.tenantId, projectId, dto);
  }

  @Patch(':projectId/groups/:groupId')
  @Permissions('project-structure.update')
  async updateGroup(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Body() dto: UpdateProjectGroupDto,
  ) {
    return this.service.updateGroup(user.tenantId, projectId, groupId, dto);
  }

  @Delete(':projectId/groups/:groupId')
  @Permissions('project-structure.delete')
  async deleteGroup(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
  ) {
    return this.service.deleteGroup(user.tenantId, projectId, groupId);
  }

  @Get(':projectId/cycles')
  @Permissions('project-structure.read')
  async listCycles(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
  ) {
    return this.service.listCycles(user.tenantId, projectId);
  }

  @Post(':projectId/cycles')
  @Permissions('project-structure.create')
  async createCycle(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Body() dto: CreateProjectCycleDto,
  ) {
    return this.service.createCycle(user.tenantId, projectId, dto);
  }

  @Patch(':projectId/cycles/:cycleId')
  @Permissions('project-structure.update')
  async updateCycle(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('cycleId', new ParseUUIDPipe({ version: '4' })) cycleId: string,
    @Body() dto: UpdateProjectCycleDto,
  ) {
    return this.service.updateCycle(user.tenantId, projectId, cycleId, dto);
  }

  @Delete(':projectId/cycles/:cycleId')
  @Permissions('project-structure.delete')
  async deleteCycle(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('cycleId', new ParseUUIDPipe({ version: '4' })) cycleId: string,
  ) {
    return this.service.deleteCycle(user.tenantId, projectId, cycleId);
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

  @Post(':projectId/enrollments/:enrollmentId/groups')
  @Permissions('enrollments.update')
  async addEnrollmentGroup(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('enrollmentId', new ParseUUIDPipe({ version: '4' }))
    enrollmentId: string,
    @Body() dto: AddEnrollmentGroupDto,
  ) {
    return this.service.addEnrollmentToGroup(
      user.tenantId,
      projectId,
      enrollmentId,
      dto.groupId,
    );
  }

  @Delete(':projectId/enrollments/:enrollmentId/groups/:groupId')
  @Permissions('enrollments.update')
  async removeEnrollmentGroup(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('enrollmentId', new ParseUUIDPipe({ version: '4' }))
    enrollmentId: string,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
  ) {
    return this.service.removeEnrollmentFromGroup(
      user.tenantId,
      projectId,
      enrollmentId,
      groupId,
    );
  }

  @Post(':projectId/enrollments/:enrollmentId/cycle')
  @Permissions('enrollments.update')
  async setEnrollmentCycle(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('enrollmentId', new ParseUUIDPipe({ version: '4' }))
    enrollmentId: string,
    @Body() dto: SetEnrollmentCycleDto,
  ) {
    return this.service.setEnrollmentCycle(
      user.tenantId,
      projectId,
      enrollmentId,
      dto.cycleId ?? null,
    );
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
    return this.service.deleteEnrollment(user.tenantId, projectId, enrollmentId);
  }
}
