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
import { CreateProjectActionAttachmentDto } from './dto/create-project-action-attachment.dto';
import { CreateProjectActionCommentDto } from './dto/create-project-action-comment.dto';
import { CreateActionPeopleGroupDto } from './dto/create-action-people-group.dto';
import {
  BulkCreateActionOccurrencesDto,
  CreateActionOccurrenceDto,
  PreviewActionOccurrencesDto,
} from './dto/create-action-occurrence.dto';
import { AddMeetingTeamParticipationDto } from './dto/add-meeting-team-participation.dto';
import { CreateProjectActionPeopleParticipationDto } from './dto/create-project-action-people-participation.dto';
import { CreateProjectActionDto } from './dto/create-project-action.dto';
import { EndProjectActionPeopleParticipationDto } from './dto/end-project-action-people-participation.dto';
import { ListActionPeopleGroupsQueryDto } from './dto/list-action-people-groups-query.dto';
import { ListActionOccurrencesQueryDto } from './dto/list-action-occurrences-query.dto';
import { ListEligibleProjectActionPeopleQueryDto } from './dto/list-eligible-project-action-people-query.dto';
import { ListProjectActionAttendanceSummaryQueryDto } from './dto/list-project-action-attendance-summary-query.dto';
import { ListProjectActionAttendancesQueryDto } from './dto/list-project-action-attendances-query.dto';
import { ListProjectActionPeopleParticipationsQueryDto } from './dto/list-project-action-people-participations-query.dto';
import { ListProjectActionsQueryDto } from './dto/list-project-actions-query.dto';
import {
  UpdateActionOccurrenceBatchDto,
  UpdateActionOccurrenceDto,
} from './dto/update-action-occurrence.dto';
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

  @Post(':projectId/actions/:actionId/comments')
  @Permissions('actions.update')
  async addComment(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Body() dto: CreateProjectActionCommentDto,
  ) {
    return this.service.addProjectActionComment(user, projectId, actionId, dto);
  }

  @Delete(':projectId/actions/:actionId/comments/:commentId')
  @Permissions('actions.update')
  async deleteComment(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Param('commentId', new ParseUUIDPipe({ version: '4' })) commentId: string,
  ) {
    return this.service.deleteProjectActionComment(
      user,
      projectId,
      actionId,
      commentId,
    );
  }

  @Post(':projectId/actions/:actionId/attachments')
  @Permissions('actions.update')
  async addAttachment(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Body() dto: CreateProjectActionAttachmentDto,
  ) {
    return this.service.addProjectActionAttachment(
      user,
      projectId,
      actionId,
      dto,
    );
  }

  @Delete(':projectId/actions/:actionId/attachments/:attachmentId')
  @Permissions('actions.update')
  async deleteAttachment(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Param('attachmentId', new ParseUUIDPipe({ version: '4' }))
    attachmentId: string,
  ) {
    return this.service.deleteProjectActionAttachment(
      user,
      projectId,
      actionId,
      attachmentId,
    );
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

  @Get(':projectId/actions/:actionId/occurrences/:occurrenceId/attendances')
  @Permissions('actions.read')
  async listAttendances(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Param('occurrenceId', new ParseUUIDPipe({ version: '4' }))
    occurrenceId: string,
    @Query() query: ListProjectActionAttendancesQueryDto,
  ) {
    return this.service.listProjectActionAttendances(
      user,
      projectId,
      actionId,
      occurrenceId,
      query,
    );
  }

  @Put(':projectId/actions/:actionId/occurrences/:occurrenceId/attendances')
  @Permissions('actions.update')
  async upsertAttendances(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Param('occurrenceId', new ParseUUIDPipe({ version: '4' }))
    occurrenceId: string,
    @Body() dto: UpsertProjectActionAttendancesDto,
  ) {
    return this.service.upsertProjectActionAttendances(
      user,
      projectId,
      actionId,
      occurrenceId,
      dto,
    );
  }

  @Get(':projectId/actions/:actionId/attendances-summary')
  @Permissions('actions.read')
  async listAttendancesSummary(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Query() query: ListProjectActionAttendanceSummaryQueryDto,
  ) {
    return this.service.listProjectActionAttendanceSummary(
      user,
      projectId,
      actionId,
      query,
    );
  }

  @Get(':projectId/actions/:actionId/people-participations')
  @Permissions('actions.read')
  async listPeopleParticipations(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Query() query: ListProjectActionPeopleParticipationsQueryDto,
  ) {
    return this.service.listProjectActionPeopleParticipations(
      user,
      projectId,
      actionId,
      query,
    );
  }

  @Get(':projectId/actions/:actionId/eligible-people')
  @Permissions('actions.read')
  async listEligiblePeople(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Query() query: ListEligibleProjectActionPeopleQueryDto,
  ) {
    return this.service.listEligibleProjectActionPeople(
      user,
      projectId,
      actionId,
      query,
    );
  }

  @Get(':projectId/actions/:actionId/people-groups')
  @Permissions('actions.read')
  async listPeopleGroups(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Query() query: ListActionPeopleGroupsQueryDto,
  ) {
    return this.service.listActionPeopleGroups(
      user,
      projectId,
      actionId,
      query,
    );
  }

  @Post(':projectId/actions/:actionId/people-groups')
  @Permissions('actions.update')
  async createPeopleGroup(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Body() dto: CreateActionPeopleGroupDto,
  ) {
    return this.service.createActionPeopleGroup(user, projectId, actionId, dto);
  }

  @Delete(':projectId/actions/:actionId/people-groups/:actionPeopleGroupId')
  @Permissions('actions.update')
  async deletePeopleGroup(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Param('actionPeopleGroupId', new ParseUUIDPipe({ version: '4' }))
    actionPeopleGroupId: string,
  ) {
    return this.service.deleteActionPeopleGroup(
      user,
      projectId,
      actionId,
      actionPeopleGroupId,
    );
  }

  @Get(':projectId/actions/:actionId/occurrences')
  @Permissions('actions.read')
  async listOccurrences(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Query() query: ListActionOccurrencesQueryDto,
  ) {
    return this.service.listActionOccurrences(user, projectId, actionId, query);
  }

  @Post(':projectId/actions/:actionId/occurrences')
  @Permissions('actions.create')
  async createOccurrence(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Body() dto: CreateActionOccurrenceDto,
  ) {
    return this.service.createActionOccurrence(user, projectId, actionId, dto);
  }

  @Post(':projectId/actions/:actionId/occurrences/bulk/preview')
  @Permissions('actions.create')
  async previewOccurrences(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Body() dto: PreviewActionOccurrencesDto,
  ) {
    return this.service.previewActionOccurrences(
      user,
      projectId,
      actionId,
      dto,
    );
  }

  @Post(':projectId/actions/:actionId/occurrences/bulk')
  @Permissions('actions.create')
  async bulkCreateOccurrences(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Body() dto: BulkCreateActionOccurrencesDto,
  ) {
    return this.service.bulkCreateActionOccurrences(
      user,
      projectId,
      actionId,
      dto,
    );
  }

  @Patch(':projectId/actions/:actionId/occurrences/batch/:recurrenceBatchId')
  @Permissions('actions.update')
  async updateOccurrenceBatch(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Param('recurrenceBatchId', new ParseUUIDPipe({ version: '4' }))
    recurrenceBatchId: string,
    @Body() dto: UpdateActionOccurrenceBatchDto,
  ) {
    return this.service.updateActionOccurrenceBatch(
      user,
      projectId,
      actionId,
      recurrenceBatchId,
      dto,
    );
  }

  @Patch(':projectId/actions/:actionId/occurrences/:occurrenceId')
  @Permissions('actions.update')
  async updateOccurrence(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Param('occurrenceId', new ParseUUIDPipe({ version: '4' }))
    occurrenceId: string,
    @Body() dto: UpdateActionOccurrenceDto,
  ) {
    return this.service.updateActionOccurrence(
      user,
      projectId,
      actionId,
      occurrenceId,
      dto,
    );
  }

  @Delete(':projectId/actions/:actionId/occurrences/:occurrenceId')
  @Permissions('actions.delete')
  async deleteOccurrence(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Param('occurrenceId', new ParseUUIDPipe({ version: '4' }))
    occurrenceId: string,
  ) {
    return this.service.deleteActionOccurrence(
      user,
      projectId,
      actionId,
      occurrenceId,
    );
  }

  @Get(':projectId/actions/:actionId/occurrences/:occurrenceId')
  @Permissions('actions.read')
  async getOccurrence(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Param('occurrenceId', new ParseUUIDPipe({ version: '4' }))
    occurrenceId: string,
  ) {
    return this.service.getActionOccurrence(
      user,
      projectId,
      actionId,
      occurrenceId,
    );
  }

  @Get(':projectId/actions/:actionId/occurrences/:occurrenceId/team')
  @Permissions('actions.read')
  async listOccurrenceTeam(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Param('occurrenceId', new ParseUUIDPipe({ version: '4' }))
    occurrenceId: string,
  ) {
    return this.service.listMeetingTeamParticipations(
      user,
      projectId,
      actionId,
      occurrenceId,
    );
  }

  @Post(':projectId/actions/:actionId/occurrences/:occurrenceId/team')
  @Permissions('actions.update')
  async addOccurrenceTeam(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Param('occurrenceId', new ParseUUIDPipe({ version: '4' }))
    occurrenceId: string,
    @Body() dto: AddMeetingTeamParticipationDto,
  ) {
    return this.service.addMeetingTeamParticipations(
      user,
      projectId,
      actionId,
      occurrenceId,
      dto,
    );
  }

  @Delete(
    ':projectId/actions/:actionId/occurrences/:occurrenceId/team/:participationId',
  )
  @Permissions('actions.update')
  async removeOccurrenceTeam(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Param('occurrenceId', new ParseUUIDPipe({ version: '4' }))
    occurrenceId: string,
    @Param('participationId', new ParseUUIDPipe({ version: '4' }))
    participationId: string,
  ) {
    return this.service.removeMeetingTeamParticipation(
      user,
      projectId,
      actionId,
      occurrenceId,
      participationId,
    );
  }

  @Post(':projectId/actions/:actionId/people-participations')
  @Permissions('actions.update')
  async createPeopleParticipation(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Body() dto: CreateProjectActionPeopleParticipationDto,
  ) {
    return this.service.createProjectActionPeopleParticipation(
      user,
      projectId,
      actionId,
      dto,
    );
  }

  @Patch(
    ':projectId/actions/:actionId/people-participations/:participationId/end',
  )
  @Permissions('actions.update')
  async endPeopleParticipation(
    @CurrentUser() user: JwtUser,
    @Param('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
    @Param('actionId', new ParseUUIDPipe({ version: '4' })) actionId: string,
    @Param('participationId', new ParseUUIDPipe({ version: '4' }))
    participationId: string,
    @Body() dto: EndProjectActionPeopleParticipationDto,
  ) {
    return this.service.endProjectActionPeopleParticipation(
      user,
      projectId,
      actionId,
      participationId,
      dto,
    );
  }
}
