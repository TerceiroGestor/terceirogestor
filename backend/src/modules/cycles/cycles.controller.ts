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
import { CreateCycleAttachmentDto } from './dto/create-cycle-attachment.dto';
import { CreateCycleCommentDto } from './dto/create-cycle-comment.dto';
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

  @Post(':id/comments')
  @Permissions('project-structure.update')
  async addComment(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreateCycleCommentDto,
  ) {
    return this.cycles.addComment(user.tenantId, user.userId, id, dto);
  }

  @Delete(':id/comments/:commentId')
  @Permissions('project-structure.update')
  async deleteComment(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('commentId', new ParseUUIDPipe({ version: '4' })) commentId: string,
  ) {
    return this.cycles.deleteComment(user.tenantId, id, commentId);
  }

  @Post(':id/attachments')
  @Permissions('project-structure.update')
  async addAttachment(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreateCycleAttachmentDto,
  ) {
    return this.cycles.addAttachment(user.tenantId, user.userId, id, dto);
  }

  @Delete(':id/attachments/:attachmentId')
  @Permissions('project-structure.update')
  async deleteAttachment(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('attachmentId', new ParseUUIDPipe({ version: '4' })) attachmentId: string,
  ) {
    return this.cycles.deleteAttachment(user.tenantId, id, attachmentId);
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
