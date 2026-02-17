import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ActionStatus,
  ActionTarget,
  AttendanceStatus,
  Prisma,
} from '../../generated/prisma';
import type { JwtUser } from '../../core/auth/strategies/jwt.strategy';
import { PrismaService } from '../../core/prisma/prisma.service';
import { parseDateInput } from '../../core/utils/dates';
import { buildPaginationMeta, resolvePagination } from '../../core/utils/pagination';
import { normalizeString } from '../../core/utils/strings';
import { CreateActionTypeDto } from './dto/create-action-type.dto';
import { CreateProjectActionDto } from './dto/create-project-action.dto';
import { ListActionTypesQueryDto } from './dto/list-action-types-query.dto';
import { ListProjectActionAttendancesQueryDto } from './dto/list-project-action-attendances-query.dto';
import { ListProjectActionsQueryDto } from './dto/list-project-actions-query.dto';
import { UpdateActionTypeDto } from './dto/update-action-type.dto';
import { UpdateProjectActionDto } from './dto/update-project-action.dto';
import { UpsertProjectActionAttendancesDto } from './dto/upsert-project-action-attendances.dto';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

function ensureValidPeriod(params: { startsAt?: Date | null; endsAt?: Date | null }) {
  const startsAt = params.startsAt ?? null;
  const endsAt = params.endsAt ?? null;
  if (startsAt && endsAt && startsAt > endsAt) {
    throw new BadRequestException('Periodo invalido: inicio maior que termino');
  }
}

function normalizeHtml(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizePhotoPaths(value: string[] | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const items = (value ?? [])
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean);
  const unique = Array.from(new Set(items));
  return unique.length ? unique.slice(0, 5) : null;
}

function resolveScopeFromTarget(params: {
  target: ActionTarget;
  groupId: string | null;
  cycleId: string | null;
}) {
  if (params.target === 'GROUP') {
    return { groupId: params.groupId, cycleId: null as string | null };
  }
  if (params.target === 'CYCLE') {
    return { groupId: null as string | null, cycleId: params.cycleId };
  }
  return { groupId: null as string | null, cycleId: null as string | null };
}

@Injectable()
export class ActionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async hasPermission(tenantId: string, userId: string, key: string) {
    const row = await this.prisma.rolePermission.findFirst({
      where: {
        tenantId,
        permission: { key },
        role: { users: { some: { userId } } },
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  private async ensureProjectExists(tenantId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Projeto nao encontrado');
  }

  private async ensureGroupBelongsToProject(tenantId: string, projectId: string, groupId: string) {
    const group = await this.prisma.projectGroup.findFirst({
      where: { id: groupId, tenantId, projectId },
      select: { id: true },
    });
    if (!group) throw new BadRequestException('Grupo invalido');
  }

  private async ensureCycleBelongsToProject(tenantId: string, projectId: string, cycleId: string) {
    const cycle = await this.prisma.projectCycle.findFirst({
      where: { id: cycleId, tenantId, projectId },
      select: { id: true },
    });
    if (!cycle) throw new BadRequestException('Ciclo invalido');
  }

  private serializeEnrollment<T extends { groupMemberships?: any[]; cycleParticipations?: any[] }>(
    enrollment: T,
  ) {
    const groups = (enrollment.groupMemberships ?? []).map((m) => m.group);
    const cycle = (enrollment.cycleParticipations ?? [])[0]?.cycle ?? null;
    const person = (enrollment as any).person;
    const withPersonFlags =
      person && person._count
        ? {
            ...person,
            hasHealthCondition: (person._count.healthConditions ?? 0) > 0,
            hasMedication: (person._count.medications ?? 0) > 0,
            _count: undefined,
          }
        : person;
    return {
      ...enrollment,
      ...(person ? { person: withPersonFlags } : {}),
      groups,
      cycle,
      groupMemberships: undefined,
      cycleParticipations: undefined,
    };
  }

  private async ensureProjectActionExists(user: JwtUser, projectId: string, actionId: string) {
    const canReadAll = await this.hasPermission(
      user.tenantId,
      user.userId,
      'actions.manage',
    );
    const action = await this.prisma.projectAction.findFirst({
      where: { id: actionId, tenantId: user.tenantId, projectId },
      include: {
        actionType: { select: { id: true, name: true, target: true } },
        createdByUser: { select: { id: true, name: true, email: true } },
        group: { select: { id: true, name: true } },
        cycle: { select: { id: true, name: true } },
      },
    });
    if (!action) throw new NotFoundException('Acao nao encontrada');
    if (!canReadAll && action.createdByUserId !== user.userId) {
      throw new ForbiddenException('Permissao negada');
    }
    return action;
  }

  async listActionTypes(tenantId: string, query: ListActionTypesQueryDto) {
    const q = normalizeString(query.q);
    return this.prisma.actionType.findMany({
      where: {
        tenantId,
        ...(query.isActiveValue === undefined ? {} : { isActive: query.isActiveValue }),
        ...(q ? { name: { contains: q } } : {}),
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  async createActionType(tenantId: string, dto: CreateActionTypeDto) {
    const name = (dto.name ?? '').trim();
    if (!name) throw new BadRequestException('Nome e obrigatorio');
    return this.prisma.actionType.create({
      data: {
        tenantId,
        name,
        description: dto.description?.trim() ? dto.description.trim() : null,
        target: dto.target ?? 'PROJECT',
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateActionType(tenantId: string, id: string, dto: UpdateActionTypeDto) {
    const existing = await this.prisma.actionType.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Tipo de acao nao encontrado');

    const name = dto.name !== undefined ? (dto.name ?? '').trim() : undefined;
    if (name !== undefined && !name) throw new BadRequestException('Nome e obrigatorio');

    return this.prisma.actionType.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() ? dto.description.trim() : null }
          : {}),
        ...(dto.target !== undefined ? { target: dto.target } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async deleteActionType(tenantId: string, id: string) {
    const existing = await this.prisma.actionType.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Tipo de acao nao encontrado');

    const usage = await this.prisma.projectAction.count({
      where: { tenantId, actionTypeId: existing.id },
    });
    if (usage > 0) {
      throw new BadRequestException('Nao e possivel excluir: tipo ja utilizado em acoes');
    }

    await this.prisma.actionType.delete({ where: { id: existing.id } });
    return { ok: true as const };
  }

  async listProjectActions(user: JwtUser, projectId: string, query: ListProjectActionsQueryDto) {
    await this.ensureProjectExists(user.tenantId, projectId);
    const canReadAll = await this.hasPermission(
      user.tenantId,
      user.userId,
      'actions.manage',
    );

    const { page, limit, skip, take } = resolvePagination({
      page: query.page,
      limit: query.limit,
      all: false,
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
    });

    const q = normalizeString(query.q);
    const effectiveMine = canReadAll ? (query.mine ?? false) : true;
    const where: Prisma.ProjectActionWhereInput = {
      tenantId: user.tenantId,
      projectId,
      ...(effectiveMine ? { createdByUserId: user.userId } : {}),
      ...(query.status ? { status: query.status as ActionStatus } : {}),
      ...(query.actionTypeId ? { actionTypeId: query.actionTypeId } : {}),
      ...(query.groupId ? { groupId: query.groupId } : {}),
      ...(query.cycleId ? { cycleId: query.cycleId } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { actionType: { name: { contains: q } } },
              { group: { name: { contains: q } } },
              { cycle: { name: { contains: q } } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.projectAction.findMany({
        where,
        include: {
          actionType: { select: { id: true, name: true, target: true } },
          createdByUser: { select: { id: true, name: true, email: true } },
          group: { select: { id: true, name: true } },
          cycle: { select: { id: true, name: true } },
        },
        orderBy: [{ plannedStartAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.projectAction.count({ where }),
    ]);

    return {
      data,
      pagination: buildPaginationMeta({ page, limit, total, isAll: false }),
    };
  }

  async getProjectAction(user: JwtUser, projectId: string, actionId: string) {
    await this.ensureProjectExists(user.tenantId, projectId);
    return this.ensureProjectActionExists(user, projectId, actionId);
  }

  async createProjectAction(user: JwtUser, projectId: string, dto: CreateProjectActionDto) {
    await this.ensureProjectExists(user.tenantId, projectId);

    const type = await this.prisma.actionType.findFirst({
      where: { id: dto.actionTypeId, tenantId: user.tenantId },
      select: { id: true, isActive: true, target: true },
    });
    if (!type) throw new BadRequestException('Tipo de acao invalido');
    if (!type.isActive) throw new BadRequestException('Tipo de acao inativo');

    const scope = resolveScopeFromTarget({
      target: type.target,
      groupId: dto.groupId ?? null,
      cycleId: dto.cycleId ?? null,
    });

    if (type.target === 'GROUP' && !scope.groupId) {
      throw new BadRequestException('Grupo e obrigatorio para este tipo de acao');
    }
    if (type.target === 'CYCLE' && !scope.cycleId) {
      throw new BadRequestException('Ciclo e obrigatorio para este tipo de acao');
    }

    if (scope.groupId) {
      await this.ensureGroupBelongsToProject(user.tenantId, projectId, scope.groupId);
    }
    if (scope.cycleId) {
      await this.ensureCycleBelongsToProject(user.tenantId, projectId, scope.cycleId);
    }

    const plannedStartAt = parseDateInput(dto.plannedStartAt);
    const plannedEndAt = parseDateInput(dto.plannedEndAt, { endOfDay: true });
    ensureValidPeriod({ startsAt: plannedStartAt ?? null, endsAt: plannedEndAt ?? null });

    const executedStartAt = parseDateInput(dto.executedStartAt);
    const executedEndAt = parseDateInput(dto.executedEndAt, { endOfDay: true });
    ensureValidPeriod({ startsAt: executedStartAt ?? null, endsAt: executedEndAt ?? null });

    const title = (dto.title ?? '').trim();
    if (!title) throw new BadRequestException('Titulo e obrigatorio');

    return this.prisma.projectAction.create({
      data: {
        tenantId: user.tenantId,
        projectId,
        createdByUserId: user.userId,
        groupId: scope.groupId,
        cycleId: scope.cycleId,
        actionTypeId: dto.actionTypeId,
        title,
        description: dto.description?.trim() ? dto.description.trim() : null,
        planHtml: normalizeHtml(dto.planHtml) ?? null,
        executedHtml: normalizeHtml(dto.executedHtml) ?? null,
        conclusionHtml: normalizeHtml(dto.conclusionHtml) ?? null,
        completionPercent: dto.completionPercent ?? null,
        photoPaths: (normalizePhotoPaths(dto.photoPaths) as any) ?? null,
        status: (dto.status as ActionStatus | undefined) ?? 'PLANNED',
        plannedStartAt,
        plannedEndAt,
        executedStartAt,
        executedEndAt,
      },
      include: {
        actionType: { select: { id: true, name: true, target: true } },
        createdByUser: { select: { id: true, name: true, email: true } },
        group: { select: { id: true, name: true } },
        cycle: { select: { id: true, name: true } },
      },
    });
  }

  async updateProjectAction(
    user: JwtUser,
    projectId: string,
    actionId: string,
    dto: UpdateProjectActionDto,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);
    const existing = await this.ensureProjectActionExists(user, projectId, actionId);

    const resolvedActionTypeId = dto.actionTypeId ?? existing.actionTypeId;
    const type = await this.prisma.actionType.findFirst({
      where: { id: resolvedActionTypeId, tenantId: user.tenantId },
      select: { id: true, isActive: true, target: true },
    });
    if (!type) throw new BadRequestException('Tipo de acao invalido');
    if (!type.isActive) throw new BadRequestException('Tipo de acao inativo');

    const groupIdInput =
      dto.groupId === undefined ? (existing.groupId ?? null) : dto.groupId ?? null;
    const cycleIdInput =
      dto.cycleId === undefined ? (existing.cycleId ?? null) : dto.cycleId ?? null;
    const scope = resolveScopeFromTarget({
      target: type.target,
      groupId: groupIdInput,
      cycleId: cycleIdInput,
    });

    if (type.target === 'GROUP' && !scope.groupId) {
      throw new BadRequestException('Grupo e obrigatorio para este tipo de acao');
    }
    if (type.target === 'CYCLE' && !scope.cycleId) {
      throw new BadRequestException('Ciclo e obrigatorio para este tipo de acao');
    }

    if (scope.groupId) {
      await this.ensureGroupBelongsToProject(user.tenantId, projectId, scope.groupId);
    }
    if (scope.cycleId) {
      await this.ensureCycleBelongsToProject(user.tenantId, projectId, scope.cycleId);
    }

    const plannedStartAt =
      dto.plannedStartAt === undefined
        ? existing.plannedStartAt
        : dto.plannedStartAt === null
          ? null
          : (parseDateInput(dto.plannedStartAt) ?? null);
    const plannedEndAt =
      dto.plannedEndAt === undefined
        ? existing.plannedEndAt
        : dto.plannedEndAt === null
          ? null
          : (parseDateInput(dto.plannedEndAt, { endOfDay: true }) ?? null);
    ensureValidPeriod({ startsAt: plannedStartAt ?? null, endsAt: plannedEndAt ?? null });

    const executedStartAt =
      dto.executedStartAt === undefined
        ? existing.executedStartAt
        : dto.executedStartAt === null
          ? null
          : (parseDateInput(dto.executedStartAt) ?? null);
    const executedEndAt =
      dto.executedEndAt === undefined
        ? existing.executedEndAt
        : dto.executedEndAt === null
          ? null
          : (parseDateInput(dto.executedEndAt, { endOfDay: true }) ?? null);
    ensureValidPeriod({ startsAt: executedStartAt ?? null, endsAt: executedEndAt ?? null });

    const title = dto.title !== undefined ? (dto.title ?? '').trim() : undefined;
    if (title !== undefined && !title) throw new BadRequestException('Titulo e obrigatorio');

    const planHtml = normalizeHtml(dto.planHtml);
    const executedHtml = normalizeHtml(dto.executedHtml);
    const conclusionHtml = normalizeHtml(dto.conclusionHtml);
    const photoPaths = normalizePhotoPaths(dto.photoPaths);

    return this.prisma.projectAction.update({
      where: { id: existing.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() ? dto.description.trim() : null }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status as ActionStatus } : {}),
        ...(dto.actionTypeId !== undefined ? { actionTypeId: resolvedActionTypeId } : {}),
        ...(dto.actionTypeId !== undefined || dto.groupId !== undefined || dto.cycleId !== undefined
          ? { groupId: scope.groupId, cycleId: scope.cycleId }
          : {}),
        ...(planHtml !== undefined ? { planHtml } : {}),
        ...(executedHtml !== undefined ? { executedHtml } : {}),
        ...(conclusionHtml !== undefined ? { conclusionHtml } : {}),
        ...(dto.completionPercent !== undefined
          ? { completionPercent: dto.completionPercent ?? null }
          : {}),
        ...(photoPaths !== undefined ? { photoPaths: (photoPaths as any) ?? null } : {}),
        ...(dto.plannedStartAt !== undefined ? { plannedStartAt } : {}),
        ...(dto.plannedEndAt !== undefined ? { plannedEndAt } : {}),
        ...(dto.executedStartAt !== undefined ? { executedStartAt } : {}),
        ...(dto.executedEndAt !== undefined ? { executedEndAt } : {}),
      },
      include: {
        actionType: { select: { id: true, name: true, target: true } },
        createdByUser: { select: { id: true, name: true, email: true } },
        group: { select: { id: true, name: true } },
        cycle: { select: { id: true, name: true } },
      },
    });
  }

  async deleteProjectAction(user: JwtUser, projectId: string, actionId: string) {
    await this.ensureProjectExists(user.tenantId, projectId);
    const existing = await this.ensureProjectActionExists(user, projectId, actionId);

    await this.prisma.projectActionAttendance.deleteMany({
      where: { tenantId: user.tenantId, actionId: existing.id },
    });

    await this.prisma.projectAction.delete({ where: { id: existing.id } });
    return { ok: true as const };
  }

  async listProjectActionAttendances(
    user: JwtUser,
    projectId: string,
    actionId: string,
    query: ListProjectActionAttendancesQueryDto,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);
    const action = await this.ensureProjectActionExists(user, projectId, actionId);

    const { page, limit, skip, take } = resolvePagination({
      page: query.page,
      limit: query.limit,
      all: false,
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
    });

    const q = normalizeString(query.q);
    const scopedGroupId = action.groupId ?? query.groupId ?? null;

    const where: Prisma.ProjectEnrollmentWhereInput = {
      tenantId: user.tenantId,
      projectId,
      status: 'ACTIVE',
      ...(scopedGroupId
        ? { groupMemberships: { some: { isActive: true, groupId: scopedGroupId } } }
        : {}),
      ...(q
        ? {
            OR: [
              { person: { fullName: { contains: q } } },
              {
                groupMemberships: {
                  some: { isActive: true, group: { name: { contains: q } } },
                },
              },
            ],
          }
        : {}),
      ...(action.cycleId
        ? { cycleParticipations: { some: { isActive: true, cycleId: action.cycleId } } }
        : {}),
    };

    const [enrollments, total] = await Promise.all([
      this.prisma.projectEnrollment.findMany({
        where,
        include: {
          person: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              birthDate: true,
              status: true,
              sex: true,
              gender: true,
              raceColor: true,
              _count: { select: { healthConditions: true, medications: true } },
            },
          },
          groupMemberships: {
            where: { isActive: true },
            include: { group: { select: { id: true, name: true } } },
          },
          cycleParticipations: {
            where: { isActive: true },
            include: { cycle: { select: { id: true, name: true } } },
          },
        },
        orderBy: [{ person: { fullName: 'asc' } }],
        skip,
        take,
      }),
      this.prisma.projectEnrollment.count({ where }),
    ]);

    const attendanceRows = await this.prisma.projectActionAttendance.findMany({
      where: {
        tenantId: user.tenantId,
        actionId,
        enrollmentId: { in: enrollments.map((row) => row.id) },
        ...(query.status ? { status: query.status as AttendanceStatus } : {}),
      },
      select: {
        id: true,
        enrollmentId: true,
        status: true,
        notes: true,
        qualityScore: true,
        qualityNotes: true,
        isHighlight: true,
        cycleParticipationId: true,
        updatedAt: true,
      },
    });

    const attendanceByEnrollment = new Map(attendanceRows.map((row) => [row.enrollmentId, row]));

    const data = enrollments
      .map((enrollment) => {
        const serialized = this.serializeEnrollment(enrollment as any);
        const attendance = attendanceByEnrollment.get(enrollment.id) ?? null;
        return { enrollment: serialized, attendance };
      })
      .filter((row) => (query.status ? row.attendance !== null : true));

    return {
      action: {
        id: action.id,
        title: action.title,
        groupId: action.groupId,
        cycleId: action.cycleId,
      },
      data,
      pagination: buildPaginationMeta({ page, limit, total, isAll: false }),
    };
  }

  async upsertProjectActionAttendances(
    user: JwtUser,
    projectId: string,
    actionId: string,
    dto: UpsertProjectActionAttendancesDto,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);
    const action = await this.ensureProjectActionExists(user, projectId, actionId);

    const items = dto.items ?? [];
    if (items.length === 0) return { ok: true as const, created: 0, updated: 0 };

    const enrollmentIds = Array.from(new Set(items.map((item) => item.enrollmentId)));
    const enrollments = await this.prisma.projectEnrollment.findMany({
      where: { tenantId: user.tenantId, projectId, id: { in: enrollmentIds } },
      select: { id: true },
    });
    if (enrollments.length !== enrollmentIds.length) {
      throw new BadRequestException('Matricula invalida');
    }

    const activeCycles = await this.prisma.projectEnrollmentCycleParticipation.findMany({
      where: {
        tenantId: user.tenantId,
        enrollmentId: { in: enrollmentIds },
        isActive: true,
        ...(action.cycleId ? { cycleId: action.cycleId } : {}),
      },
      select: { id: true, enrollmentId: true },
    });
    const cycleByEnrollment = new Map(activeCycles.map((row) => [row.enrollmentId, row.id]));

    const existing = await this.prisma.projectActionAttendance.findMany({
      where: { tenantId: user.tenantId, actionId, enrollmentId: { in: enrollmentIds } },
      select: { id: true, enrollmentId: true },
    });
    const existingByEnrollment = new Map(existing.map((row) => [row.enrollmentId, row.id]));

    let created = 0;
    let updated = 0;

    const batchSize = 25;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (item) => {
          const notes =
            item.notes === undefined
              ? undefined
              : item.notes === null
                ? null
                : item.notes.trim()
                  ? item.notes.trim()
                  : null;
          const qualityNotes =
            item.qualityNotes === undefined
              ? undefined
              : item.qualityNotes === null
                ? null
                : item.qualityNotes.trim()
                  ? item.qualityNotes.trim()
                  : null;

          const cycleParticipationId = cycleByEnrollment.get(item.enrollmentId) ?? null;
          const existingId = existingByEnrollment.get(item.enrollmentId) ?? null;

          if (existingId) {
            await this.prisma.projectActionAttendance.update({
              where: { id: existingId },
              data: {
                status: item.status,
                ...(notes !== undefined ? { notes } : {}),
                ...(item.qualityScore !== undefined ? { qualityScore: item.qualityScore ?? null } : {}),
                ...(qualityNotes !== undefined ? { qualityNotes } : {}),
                ...(item.isHighlight !== undefined ? { isHighlight: item.isHighlight } : {}),
                cycleParticipationId,
              },
            });
            updated += 1;
            return;
          }

          await this.prisma.projectActionAttendance.create({
            data: {
              tenantId: user.tenantId,
              actionId,
              enrollmentId: item.enrollmentId,
              status: item.status,
              notes: notes === undefined ? null : notes,
              qualityScore: item.qualityScore ?? null,
              qualityNotes: qualityNotes === undefined ? null : qualityNotes,
              isHighlight: item.isHighlight ?? false,
              cycleParticipationId,
            },
          });
          created += 1;
        }),
      );

      const failed = results.find((result) => result.status === 'rejected');
      if (failed && failed.status === 'rejected') {
        throw failed.reason;
      }
    }

    return { ok: true as const, created, updated };
  }
}
