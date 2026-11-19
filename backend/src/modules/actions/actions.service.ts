import { randomUUID } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ActionPeopleParticipationRole,
  ActionStatus,
  ActionTarget,
  AttendanceStatus,
  ParticipationKind,
  Prisma,
} from '../../generated/prisma';
import type { JwtUser } from '../../core/auth/strategies/jwt.strategy';
import { PrismaService } from '../../core/prisma/prisma.service';
import { parseDateInput } from '../../core/utils/dates';
import {
  buildPaginationMeta,
  resolvePagination,
} from '../../core/utils/pagination';
import { normalizeString } from '../../core/utils/strings';
import {
  buildPeopleWhere,
  parseAdvancedFilters,
} from '../people/people.filters';
import { generateOccurrenceDates } from './action-occurrence-schedule';
import { CreateActionTypeDto } from './dto/create-action-type.dto';
import { CreateActionPeopleGroupDto } from './dto/create-action-people-group.dto';
import {
  BulkCreateActionOccurrencesDto,
  CreateActionOccurrenceDto,
  PreviewActionOccurrencesDto,
} from './dto/create-action-occurrence.dto';
import { ListActionOccurrencesQueryDto } from './dto/list-action-occurrences-query.dto';
import { CreateProjectActionPeopleParticipationDto } from './dto/create-project-action-people-participation.dto';
import { CreateProjectActionDto } from './dto/create-project-action.dto';
import { EndProjectActionPeopleParticipationDto } from './dto/end-project-action-people-participation.dto';
import { ListEligibleProjectActionPeopleQueryDto } from './dto/list-eligible-project-action-people-query.dto';
import { ListActionTypesQueryDto } from './dto/list-action-types-query.dto';
import { ListActionPeopleGroupsQueryDto } from './dto/list-action-people-groups-query.dto';
import { ListProjectActionAttendanceSummaryQueryDto } from './dto/list-project-action-attendance-summary-query.dto';
import { ListProjectActionAttendancesQueryDto } from './dto/list-project-action-attendances-query.dto';
import { ListProjectActionPeopleParticipationsQueryDto } from './dto/list-project-action-people-participations-query.dto';
import { ListProjectActionsQueryDto } from './dto/list-project-actions-query.dto';
import {
  UpdateActionOccurrenceBatchDto,
  UpdateActionOccurrenceDto,
} from './dto/update-action-occurrence.dto';
import { UpdateActionTypeDto } from './dto/update-action-type.dto';
import { UpdateProjectActionDto } from './dto/update-project-action.dto';
import { UpsertProjectActionAttendancesDto } from './dto/upsert-project-action-attendances.dto';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;
const MAX_BULK_OCCURRENCES = 200;

const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function combineDateAndTime(date: Date, time: string): Date {
  const match = TIME_OF_DAY_PATTERN.exec(time.trim());
  if (!match) throw new BadRequestException('Horario invalido (use HH:mm)');
  const combined = new Date(date.getTime());
  combined.setUTCHours(Number(match[1]), Number(match[2]), 0, 0);
  return combined;
}

function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toTimeOfDay(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function ensureValidPeriod(params: {
  startsAt?: Date | null;
  endsAt?: Date | null;
}) {
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

function normalizeTags(tags?: string[] | null) {
  if (!tags) return null;
  const cleaned = Array.from(
    new Set(tags.map((tag) => tag.trim()).filter(Boolean)),
  );
  return cleaned.length ? JSON.stringify(cleaned) : null;
}

function parseTags(value: string | null | undefined) {
  if (!value) return [] as string[];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.map((tag) => String(tag ?? '').trim()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function parseMentionUserIds(value: Prisma.JsonValue | null | undefined) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(value.map((entry) => String(entry ?? '').trim()).filter(Boolean)),
  );
}

function resolvePrimaryActionPeopleGroup(action: {
  peopleGroups?: Array<{
    peopleGroupId: string;
    participationKind?: ParticipationKind;
    peopleGroup?: {
      id: string;
      name: string;
      category?: string | null;
      description?: string | null;
      ageMin?: number | null;
      ageMax?: number | null;
      isActive?: boolean;
    } | null;
  }>;
}) {
  const rows = action.peopleGroups ?? [];
  return (
    rows.find((row) => row.participationKind === 'PARTICIPANT') ??
    rows[0] ??
    null
  );
}

const mapCommentAuthor = (
  user:
    | {
      id: string;
      name: string | null;
      email: string | null;
      avatarUrl?: string | null;
    }
    | null
    | undefined,
) => ({
  id: user?.id ?? null,
  name: user?.name?.trim() || user?.email || 'Equipe interna',
  email: user?.email ?? null,
  avatarUrl: user?.avatarUrl ?? null,
});

const mapProjectActionCommentItem = (comment: {
  id: string;
  body: string;
  mentionUserIds: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  authorUser?: {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl?: string | null;
  } | null;
}) => ({
  id: comment.id,
  body: comment.body,
  mentionUserIds: parseMentionUserIds(comment.mentionUserIds),
  author: mapCommentAuthor(comment.authorUser),
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

const mapProjectActionAttachmentItem = (attachment: {
  id: string;
  label: string;
  filePath: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  createdAt: Date;
  updatedAt: Date;
  uploadedByUser?: {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl?: string | null;
  } | null;
}) => ({
  id: attachment.id,
  label: attachment.label,
  filePath: attachment.filePath,
  mimeType: attachment.mimeType ?? null,
  fileSizeBytes: attachment.fileSizeBytes ?? null,
  uploadedBy: attachment.uploadedByUser
    ? {
      id: attachment.uploadedByUser.id,
      name:
        attachment.uploadedByUser.name?.trim() ||
        attachment.uploadedByUser.email ||
        'Equipe interna',
      email: attachment.uploadedByUser.email ?? null,
      avatarUrl: attachment.uploadedByUser.avatarUrl ?? null,
    }
    : null,
  createdAt: attachment.createdAt,
  updatedAt: attachment.updatedAt,
});

function serializeProjectAction(action: any) {
  const primaryPeopleGroup = resolvePrimaryActionPeopleGroup(action);
  const participantGroups = (action.peopleGroups ?? []).filter(
    (row: { participationKind?: ParticipationKind }) =>
      row.participationKind === 'PARTICIPANT',
  );
  return {
    ...action,
    peopleGroupId: primaryPeopleGroup?.peopleGroupId ?? null,
    peopleGroupIds: participantGroups.map(
      (row: { peopleGroupId: string }) => row.peopleGroupId,
    ),
    tags: parseTags(action.tags),
    peopleGroup: primaryPeopleGroup?.peopleGroup ?? null,
    peopleGroups: participantGroups.map(
      (row: { peopleGroupId: string; peopleGroup: unknown }) => ({
        peopleGroupId: row.peopleGroupId,
        peopleGroup: row.peopleGroup,
      }),
    ),
    comments: action.comments?.map(mapProjectActionCommentItem) ?? [],
    attachments: action.attachments?.map(mapProjectActionAttachmentItem) ?? [],
  };
}

function resolveScopeFromTarget(params: {
  target: ActionTarget;
  peopleGroupIds: string[];
  targetEnrollmentId: string | null;
}) {
  if (params.target === 'PEOPLE_GROUP') {
    return {
      peopleGroupIds: [...new Set(params.peopleGroupIds)],
      targetEnrollmentId: null as string | null,
    };
  }
  if (params.target === 'ENROLLMENT') {
    return {
      peopleGroupIds: [] as string[],
      targetEnrollmentId: params.targetEnrollmentId,
    };
  }
  return {
    peopleGroupIds: [] as string[],
    targetEnrollmentId: null as string | null,
  };
}

const projectActionInclude = {
  project: { select: { id: true, name: true } },
  actionType: { select: { id: true, name: true, target: true } },
  goal: { select: { id: true, title: true } },
  createdByUser: { select: { id: true, name: true, email: true } },
  peopleGroups: {
    where: { participationKind: 'PARTICIPANT' },
    include: {
      peopleGroup: {
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
          ageMin: true,
          ageMax: true,
          isActive: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
  targetEnrollment: {
    include: {
      person: {
        select: {
          id: true,
          fullName: true,
          socialName: true,
          birthDate: true,
          status: true,
          avatarUrl: true,
          peopleGroupParticipations: {
            where: { isActive: true, deletedAt: null },
            select: {
              peopleGroup: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.ActivityInclude;

const actionOccurrenceInclude = {
  teamPeopleGroups: {
    include: { peopleGroup: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  },
  peopleGroups: {
    include: { peopleGroup: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.MeetingInclude;

function serializeMeeting(occurrence: {
  peopleGroups?: Array<{
    peopleGroupId: string;
    peopleGroup: { id: string; name: string };
  }>;
  [key: string]: unknown;
}) {
  const peopleGroups = occurrence.peopleGroups ?? [];
  return {
    ...occurrence,
    peopleGroupIds: peopleGroups.map((row) => row.peopleGroupId),
    peopleGroup: peopleGroups[0]?.peopleGroup ?? null,
  };
}

function buildProjectActionWhere(params: {
  tenantId: string;
  userId: string;
  canReadAll: boolean;
  query: ListProjectActionsQueryDto;
  projectId?: string | null;
}) {
  const { tenantId, userId, canReadAll, query } = params;
  const q = normalizeString(query.q);
  const effectiveMine = canReadAll ? (query.mine ?? false) : true;
  const resolvedProjectId = params.projectId ?? query.projectId ?? null;
  const scopedPeopleGroupId = query.peopleGroupId ?? null;
  const and: Prisma.ActivityWhereInput[] = [];

  if (query.actionTypeId) {
    and.push({ actionTypeId: query.actionTypeId });
  }
  if (scopedPeopleGroupId) {
    and.push({
      peopleGroups: {
        some: {
          participationKind: 'PARTICIPANT',
          peopleGroupId: scopedPeopleGroupId,
        },
      },
    });
  }
  if (q) {
    and.push({
      OR: [
        { title: { contains: q } },
        { tags: { contains: q } },
        { internalNotes: { contains: q } },
        { actionType: { name: { contains: q } } },
        { project: { name: { contains: q } } },
        { peopleGroups: { some: { peopleGroup: { name: { contains: q } } } } },
        {
          peopleGroups: {
            some: { peopleGroup: { category: { contains: q } } },
          },
        },
      ],
    });
  }

  return {
    tenantId,
    ...(resolvedProjectId ? { projectId: resolvedProjectId } : {}),
    ...(effectiveMine ? { createdByUserId: userId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(and.length ? { AND: and } : {}),
  } satisfies Prisma.ActivityWhereInput;
}

@Injectable()
export class ActionsService {
  constructor(private readonly prisma: PrismaService) { }

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

  private async ensurePeopleGroupBelongsToProject(
    tenantId: string,
    projectId: string,
    peopleGroupId: string,
    participationKind: ParticipationKind = 'PARTICIPANT',
  ) {
    const peopleGroupLink = await this.prisma.projectPeopleGroup.findFirst({
      where: { tenantId, projectId, peopleGroupId, participationKind },
      select: { id: true },
    });
    if (!peopleGroupLink)
      throw new BadRequestException('Grupo invalido');
  }

  private async ensureTeamPeopleGroupsBelongToAction(
    tenantId: string,
    actionId: string,
    teamPeopleGroupIds: string[],
  ) {
    const uniqueIds = Array.from(new Set(teamPeopleGroupIds));
    await Promise.all(
      uniqueIds.map((peopleGroupId) =>
        this.ensurePeopleGroupBelongsToAction(
          tenantId,
          actionId,
          peopleGroupId,
          'TEAM',
        ),
      ),
    );
    return uniqueIds;
  }

  private async ensureParticipantPeopleGroupsBelongToAction(
    tenantId: string,
    actionId: string,
    peopleGroupIds: string[],
  ) {
    const uniqueIds = Array.from(new Set(peopleGroupIds));
    await Promise.all(
      uniqueIds.map((peopleGroupId) =>
        this.ensurePeopleGroupBelongsToAction(
          tenantId,
          actionId,
          peopleGroupId,
          'PARTICIPANT',
        ),
      ),
    );
    return uniqueIds;
  }

  private async ensurePeopleGroupBelongsToAction(
    tenantId: string,
    actionId: string,
    peopleGroupId: string,
    participationKind: ParticipationKind = 'PARTICIPANT',
  ) {
    const peopleGroupLink = await this.prisma.activityPeopleGroup.findFirst({
      where: {
        tenantId,
        actionId,
        peopleGroupId,
        participationKind,
      },
      select: { id: true },
    });
    if (!peopleGroupLink)
      throw new BadRequestException(
        'Grupo invalido para esta atividade',
      );
  }

  private async ensureEnrollmentBelongsToProject(
    tenantId: string,
    projectId: string,
    enrollmentId: string,
  ) {
    const enrollment = await this.prisma.projectEnrollment.findFirst({
      where: { id: enrollmentId, tenantId, projectId, deletedAt: null },
      select: { id: true },
    });
    if (!enrollment) throw new BadRequestException('Participante invalido');
  }

  private async ensureGoalBelongsToProject(
    tenantId: string,
    projectId: string,
    goalId: string,
  ) {
    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, tenantId, projectId },
      select: { id: true },
    });
    if (!goal) throw new BadRequestException('Meta invalida');
  }

  // Fase 3 do plano mestre: uma pessoa pode ter presenca em N encontros
  // (Meeting) no mesmo dia, mas conta como 1 unico dia de permanencia no
  // servico. Reavalia do zero (nao incrementa/decrementa) para que
  // corrigir uma presenca de PRESENT para ABSENT remova a presenca diaria
  // quando nao sobra nenhum outro encontro PRESENT naquele dia.
  private async syncDailyAttendanceForPersonDate(
    tenantId: string,
    personId: string,
    date: Date,
  ) {
    const hasPresence = await this.prisma.meetingAttendance.count({
      where: {
        tenantId,
        status: 'PRESENT',
        enrollment: { personId },
        occurrence: { scheduledDate: date },
      },
    });

    if (hasPresence > 0) {
      await this.prisma.dailyAttendance.upsert({
        where: { tenantId_personId_date: { tenantId, personId, date } },
        create: { tenantId, personId, date },
        update: {},
      });
    } else {
      await this.prisma.dailyAttendance.deleteMany({
        where: { tenantId, personId, date },
      });
    }
  }

  // Reavalia a presenca diaria de um conjunto de pessoas para uma data -
  // usado depois de qualquer escrita em lote que mude presenca (upsert,
  // exclusao de encontro, exclusao de atividade inteira).
  private async syncDailyAttendanceForPeopleDate(
    tenantId: string,
    personIds: Iterable<string>,
    date: Date,
  ) {
    const uniquePersonIds = Array.from(new Set(personIds));
    for (const personId of uniquePersonIds) {
      await this.syncDailyAttendanceForPersonDate(tenantId, personId, date);
    }
  }

  private serializeEnrollment<T>(enrollment: T) {
    const person = (enrollment as any).person;
    const peopleGroups = (person?.peopleGroupParticipations ?? [])
      .map(
        (participation: { peopleGroup?: unknown }) => participation.peopleGroup,
      )
      .filter((peopleGroup: unknown) => Boolean(peopleGroup));
    const withPersonFlags =
      person && person._count
        ? {
          ...person,
          hasHealthCondition: (person._count.healthConditions ?? 0) > 0,
          hasMedication: (person._count.medications ?? 0) > 0,
          _count: undefined,
          peopleGroupParticipations: undefined,
        }
        : person;
    return {
      ...enrollment,
      ...(person ? { person: withPersonFlags } : {}),
      cycle: null,
      peopleGroups,
    };
  }

  private async ensureProjectActionExists(
    user: JwtUser,
    projectId: string,
    actionId: string,
  ) {
    const canReadAll = await this.hasPermission(
      user.tenantId,
      user.userId,
      'actions.manage',
    );
    const action = await this.prisma.activity.findFirst({
      where: { id: actionId, tenantId: user.tenantId, projectId },
      include: {
        actionType: { select: { id: true, name: true, target: true } },
        goal: { select: { id: true, title: true } },
        createdByUser: { select: { id: true, name: true, email: true } },
        peopleGroups: {
          where: { participationKind: 'PARTICIPANT' },
          include: {
            peopleGroup: {
              select: {
                id: true,
                name: true,
                category: true,
                description: true,
                ageMin: true,
                ageMax: true,
                isActive: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        targetEnrollment: {
          include: {
            person: {
              select: {
                id: true,
                fullName: true,
                socialName: true,
                birthDate: true,
                status: true,
                avatarUrl: true,
                peopleGroupParticipations: {
                  where: { isActive: true, deletedAt: null },
                  select: {
                    peopleGroup: {
                      select: {
                        id: true,
                        name: true,
                        category: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            authorUser: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
          include: {
            uploadedByUser: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });
    if (!action) throw new NotFoundException('Acao nao encontrada');
    if (!canReadAll && action.createdByUserId !== user.userId) {
      throw new ForbiddenException('Permissao negada');
    }
    return serializeProjectAction(action);
  }

  /**
   * Chamar depois de validar `peopleGroupIds` (ensurePeopleGroupBelongsToProject
   * em cada um) - este metodo nao revalida, para nao escrever a Activity e
   * so depois falhar com um id invalido, deixando um registro orfao sem
   * nenhum grupo-alvo.
   */
  private async syncParticipantPeopleGroupScope(params: {
    tenantId: string;
    actionId: string;
    peopleGroupIds: string[];
  }) {
    await this.prisma.activityPeopleGroup.deleteMany({
      where: {
        tenantId: params.tenantId,
        actionId: params.actionId,
        participationKind: 'PARTICIPANT',
      },
    });

    if (!params.peopleGroupIds.length) {
      return;
    }

    await this.prisma.activityPeopleGroup.createMany({
      data: params.peopleGroupIds.map((peopleGroupId) => ({
        tenantId: params.tenantId,
        actionId: params.actionId,
        peopleGroupId,
        participationKind: 'PARTICIPANT' as const,
      })),
    });
  }

  async listActionTypes(tenantId: string, query: ListActionTypesQueryDto) {
    const q = normalizeString(query.q);
    return this.prisma.activityType.findMany({
      where: {
        tenantId,
        ...(query.isActiveValue === undefined
          ? {}
          : { isActive: query.isActiveValue }),
        ...(q ? { name: { contains: q } } : {}),
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  async createActionType(tenantId: string, dto: CreateActionTypeDto) {
    const name = (dto.name ?? '').trim();
    if (!name) throw new BadRequestException('Nome e obrigatorio');
    return this.prisma.activityType.create({
      data: {
        tenantId,
        name,
        description: dto.description?.trim() ? dto.description.trim() : null,
        target: dto.target ?? 'PROJECT',
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateActionType(
    tenantId: string,
    id: string,
    dto: UpdateActionTypeDto,
  ) {
    const existing = await this.prisma.activityType.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Tipo de acao nao encontrado');

    const name = dto.name !== undefined ? (dto.name ?? '').trim() : undefined;
    if (name !== undefined && !name)
      throw new BadRequestException('Nome e obrigatorio');

    return this.prisma.activityType.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(dto.description !== undefined
          ? {
            description: dto.description?.trim()
              ? dto.description.trim()
              : null,
          }
          : {}),
        ...(dto.target !== undefined ? { target: dto.target } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async deleteActionType(tenantId: string, id: string) {
    const existing = await this.prisma.activityType.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Tipo de acao nao encontrado');

    const usage = await this.prisma.activity.count({
      where: { tenantId, actionTypeId: existing.id },
    });
    if (usage > 0) {
      throw new BadRequestException(
        'Nao e possivel excluir: tipo ja utilizado em acoes',
      );
    }

    await this.prisma.activityType.delete({ where: { id: existing.id } });
    return { ok: true as const };
  }

  async listProjectActions(
    user: JwtUser,
    projectId: string,
    query: ListProjectActionsQueryDto,
  ) {
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

    const where = buildProjectActionWhere({
      tenantId: user.tenantId,
      userId: user.userId,
      canReadAll,
      query,
      projectId,
    });

    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        include: projectActionInclude,
        orderBy: [{ plannedStartAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.activity.count({ where }),
    ]);

    return {
      data: data.map((item) => serializeProjectAction(item)),
      pagination: buildPaginationMeta({ page, limit, total, isAll: false }),
    };
  }

  async listActions(user: JwtUser, query: ListProjectActionsQueryDto) {
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

    const where = buildProjectActionWhere({
      tenantId: user.tenantId,
      userId: user.userId,
      canReadAll,
      query,
    });

    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        include: projectActionInclude,
        orderBy: [{ plannedStartAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.activity.count({ where }),
    ]);

    return {
      data: data.map((item) => serializeProjectAction(item)),
      pagination: buildPaginationMeta({ page, limit, total, isAll: false }),
    };
  }

  // Fase 3 do plano mestre: "relatorio simples" comparando frequencia por
  // atividade (quantos encontros a pessoa compareceu) com frequencia de
  // permanencia no servico (quantos dias distintos, sem duplicar quando
  // ha mais de um encontro no mesmo dia).
  async getPersonAttendanceSummary(
    tenantId: string,
    personId: string,
    month?: string,
  ) {
    const person = await this.prisma.person.findFirst({
      where: { id: personId, tenantId },
      select: { id: true },
    });
    if (!person) throw new NotFoundException('Pessoa nao encontrada');

    const resolvedMonth = month ?? new Date().toISOString().slice(0, 7);
    const match = /^(\d{4})-(\d{2})$/.exec(resolvedMonth);
    if (!match) {
      throw new BadRequestException('Mes invalido, use o formato AAAA-MM');
    }
    const year = Number(match[1]);
    const monthNumber = Number(match[2]);
    if (monthNumber < 1 || monthNumber > 12) {
      throw new BadRequestException('Mes invalido, use o formato AAAA-MM');
    }
    const start = new Date(Date.UTC(year, monthNumber - 1, 1));
    const end = new Date(Date.UTC(year, monthNumber, 1));

    const [activityAttendances, dailyAttendances] = await Promise.all([
      this.prisma.meetingAttendance.count({
        where: {
          tenantId,
          status: 'PRESENT',
          enrollment: { personId },
          occurrence: { scheduledDate: { gte: start, lt: end } },
        },
      }),
      this.prisma.dailyAttendance.count({
        where: { tenantId, personId, date: { gte: start, lt: end } },
      }),
    ]);

    return {
      personId,
      month: resolvedMonth,
      activityAttendances,
      dailyAttendances,
    };
  }

  async getProjectAction(user: JwtUser, projectId: string, actionId: string) {
    await this.ensureProjectExists(user.tenantId, projectId);
    return this.ensureProjectActionExists(user, projectId, actionId);
  }

  async createProjectAction(
    user: JwtUser,
    projectId: string,
    dto: CreateProjectActionDto,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);

    const type = await this.prisma.activityType.findFirst({
      where: { id: dto.actionTypeId, tenantId: user.tenantId },
      select: { id: true, isActive: true, target: true },
    });
    if (!type) throw new BadRequestException('Tipo de acao invalido');
    if (!type.isActive) throw new BadRequestException('Tipo de acao inativo');

    const scope = resolveScopeFromTarget({
      target: type.target,
      peopleGroupIds: dto.peopleGroupIds ?? [],
      targetEnrollmentId: dto.targetEnrollmentId ?? null,
    });

    if (type.target === 'PEOPLE_GROUP' && scope.peopleGroupIds.length === 0) {
      throw new BadRequestException(
        'Grupo e obrigatorio para este tipo de acao',
      );
    }
    if (type.target === 'ENROLLMENT' && !scope.targetEnrollmentId) {
      throw new BadRequestException(
        'Participante e obrigatorio para este tipo de acao',
      );
    }

    await Promise.all(
      scope.peopleGroupIds.map((peopleGroupId) =>
        this.ensurePeopleGroupBelongsToProject(
          user.tenantId,
          projectId,
          peopleGroupId,
          'PARTICIPANT',
        ),
      ),
    );
    if (scope.targetEnrollmentId) {
      await this.ensureEnrollmentBelongsToProject(
        user.tenantId,
        projectId,
        scope.targetEnrollmentId,
      );
    }
    if (dto.goalId) {
      await this.ensureGoalBelongsToProject(
        user.tenantId,
        projectId,
        dto.goalId,
      );
    }

    const plannedStartAt = parseDateInput(dto.plannedStartAt);
    const plannedEndAt = parseDateInput(dto.plannedEndAt, { endOfDay: true });
    ensureValidPeriod({
      startsAt: plannedStartAt ?? null,
      endsAt: plannedEndAt ?? null,
    });

    const executedStartAt = parseDateInput(dto.executedStartAt);
    const executedEndAt = parseDateInput(dto.executedEndAt, { endOfDay: true });
    ensureValidPeriod({
      startsAt: executedStartAt ?? null,
      endsAt: executedEndAt ?? null,
    });

    const title = (dto.title ?? '').trim();
    if (!title) throw new BadRequestException('Titulo e obrigatorio');

    const created = await this.prisma.activity.create({
      data: {
        tenantId: user.tenantId,
        projectId,
        createdByUserId: user.userId,
        targetEnrollmentId: scope.targetEnrollmentId,
        actionTypeId: dto.actionTypeId,
        goalId: dto.goalId ?? null,
        title,
        description: dto.description?.trim() ? dto.description.trim() : null,
        pedagogicalPlanHtml: normalizeHtml(dto.pedagogicalPlanHtml) ?? null,
        tags: normalizeTags(dto.tags),
        internalNotes: dto.internalNotes?.trim()
          ? dto.internalNotes.trim()
          : null,
        completionPercent: dto.completionPercent ?? null,
        status: dto.status ?? 'PLANNED',
        plannedStartAt,
        plannedEndAt,
        executedStartAt,
        executedEndAt,
      },
    });
    await this.syncParticipantPeopleGroupScope({
      tenantId: user.tenantId,
      actionId: created.id,
      peopleGroupIds: scope.peopleGroupIds,
    });
    return this.getProjectAction(user, projectId, created.id);
  }

  async updateProjectAction(
    user: JwtUser,
    projectId: string,
    actionId: string,
    dto: UpdateProjectActionDto,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);
    const existing = await this.ensureProjectActionExists(
      user,
      projectId,
      actionId,
    );

    const resolvedActionTypeId = dto.actionTypeId ?? existing.actionTypeId;
    const type = await this.prisma.activityType.findFirst({
      where: { id: resolvedActionTypeId, tenantId: user.tenantId },
      select: { id: true, isActive: true, target: true },
    });
    if (!type) throw new BadRequestException('Tipo de acao invalido');
    if (!type.isActive) throw new BadRequestException('Tipo de acao inativo');

    const peopleGroupIdsInput =
      dto.peopleGroupIds === undefined
        ? ((existing.peopleGroupIds as string[] | undefined) ?? [])
        : (dto.peopleGroupIds ?? []);
    const targetEnrollmentIdInput =
      dto.targetEnrollmentId === undefined
        ? (existing.targetEnrollmentId ?? null)
        : (dto.targetEnrollmentId ?? null);
    const scope = resolveScopeFromTarget({
      target: type.target,
      peopleGroupIds: peopleGroupIdsInput,
      targetEnrollmentId: targetEnrollmentIdInput,
    });

    if (type.target === 'PEOPLE_GROUP' && scope.peopleGroupIds.length === 0) {
      throw new BadRequestException(
        'Grupo e obrigatorio para este tipo de acao',
      );
    }
    if (type.target === 'ENROLLMENT' && !scope.targetEnrollmentId) {
      throw new BadRequestException(
        'Participante e obrigatorio para este tipo de acao',
      );
    }

    await Promise.all(
      scope.peopleGroupIds.map((peopleGroupId) =>
        this.ensurePeopleGroupBelongsToProject(
          user.tenantId,
          projectId,
          peopleGroupId,
          'PARTICIPANT',
        ),
      ),
    );
    if (scope.targetEnrollmentId) {
      await this.ensureEnrollmentBelongsToProject(
        user.tenantId,
        projectId,
        scope.targetEnrollmentId,
      );
    }
    if (dto.goalId) {
      await this.ensureGoalBelongsToProject(
        user.tenantId,
        projectId,
        dto.goalId,
      );
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
    ensureValidPeriod({
      startsAt: plannedStartAt ?? null,
      endsAt: plannedEndAt ?? null,
    });

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
    ensureValidPeriod({
      startsAt: executedStartAt ?? null,
      endsAt: executedEndAt ?? null,
    });

    const title =
      dto.title !== undefined ? (dto.title ?? '').trim() : undefined;
    if (title !== undefined && !title)
      throw new BadRequestException('Titulo e obrigatorio');

    const normalizedTags =
      dto.tags !== undefined ? normalizeTags(dto.tags) : undefined;

    await this.prisma.activity.update({
      where: { id: existing.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(dto.description !== undefined
          ? {
            description: dto.description?.trim()
              ? dto.description.trim()
              : null,
          }
          : {}),
        ...(dto.pedagogicalPlanHtml !== undefined
          ? {
            pedagogicalPlanHtml:
              normalizeHtml(dto.pedagogicalPlanHtml) ?? null,
          }
          : {}),
        ...(dto.tags !== undefined ? { tags: normalizedTags } : {}),
        ...(dto.internalNotes !== undefined
          ? {
            internalNotes: dto.internalNotes?.trim()
              ? dto.internalNotes.trim()
              : null,
          }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.actionTypeId !== undefined
          ? { actionTypeId: resolvedActionTypeId }
          : {}),
        ...(dto.goalId !== undefined ? { goalId: dto.goalId ?? null } : {}),
        ...(dto.actionTypeId !== undefined ||
          dto.peopleGroupIds !== undefined ||
          dto.targetEnrollmentId !== undefined
          ? {
            targetEnrollmentId: scope.targetEnrollmentId,
          }
          : {}),
        ...(dto.completionPercent !== undefined
          ? { completionPercent: dto.completionPercent ?? null }
          : {}),
        ...(dto.plannedStartAt !== undefined ? { plannedStartAt } : {}),
        ...(dto.plannedEndAt !== undefined ? { plannedEndAt } : {}),
        ...(dto.executedStartAt !== undefined ? { executedStartAt } : {}),
        ...(dto.executedEndAt !== undefined ? { executedEndAt } : {}),
      },
    });
    if (
      dto.actionTypeId !== undefined ||
      dto.peopleGroupIds !== undefined ||
      dto.targetEnrollmentId !== undefined
    ) {
      await this.syncParticipantPeopleGroupScope({
        tenantId: user.tenantId,
        actionId: existing.id,
        peopleGroupIds: scope.peopleGroupIds,
      });
    }
    return this.getProjectAction(user, projectId, existing.id);
  }

  async deleteProjectAction(
    user: JwtUser,
    projectId: string,
    actionId: string,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);
    const existing = await this.ensureProjectActionExists(
      user,
      projectId,
      actionId,
    );

    // Fase 3: capturar quem tinha presenca PRESENT (e em que dia) antes de
    // apagar tudo, para reavaliar a presenca diaria depois.
    const presentAttendances = await this.prisma.meetingAttendance.findMany({
      where: {
        tenantId: user.tenantId,
        actionId: existing.id,
        status: 'PRESENT',
      },
      select: {
        enrollment: { select: { personId: true } },
        occurrence: { select: { scheduledDate: true } },
      },
    });
    const personIdsByDate = new Map<number, Set<string>>();
    for (const row of presentAttendances) {
      const key = row.occurrence.scheduledDate.getTime();
      const bucket = personIdsByDate.get(key) ?? new Set<string>();
      bucket.add(row.enrollment.personId);
      personIdsByDate.set(key, bucket);
    }

    await this.prisma.meetingAttendance.deleteMany({
      where: { tenantId: user.tenantId, actionId: existing.id },
    });
    // Precisa vir depois da presença/grupos do encontro (FK occurrenceId é
    // RESTRICT) e antes da própria ação (FK actionId do encontro também é
    // RESTRICT) - achado ao implementar a Fase 3: excluir uma atividade com
    // encontro já agendado (Fase 1/2) já falhava com erro de FK antes desta
    // correção; o mesmo valia pros grupos do encontro (Ciclo 2 da Fase 4,
    // 2026-11-16) e passou a ser limpo aqui também.
    const occurrenceIds = (
      await this.prisma.meeting.findMany({
        where: { tenantId: user.tenantId, actionId: existing.id },
        select: { id: true },
      })
    ).map((row) => row.id);
    await this.prisma.actionOccurrenceTeamGroup.deleteMany({
      where: { tenantId: user.tenantId, occurrenceId: { in: occurrenceIds } },
    });
    await this.prisma.actionOccurrencePeopleGroup.deleteMany({
      where: { tenantId: user.tenantId, occurrenceId: { in: occurrenceIds } },
    });
    await this.prisma.meeting.deleteMany({
      where: { tenantId: user.tenantId, actionId: existing.id },
    });
    await this.prisma.activityPeopleGroup.deleteMany({
      where: { tenantId: user.tenantId, actionId: existing.id },
    });
    await this.prisma.projectActionPeopleParticipation.deleteMany({
      where: { tenantId: user.tenantId, actionId: existing.id },
    });
    await this.prisma.projectActionComment.deleteMany({
      where: { tenantId: user.tenantId, actionId: existing.id },
    });
    await this.prisma.projectActionAttachment.deleteMany({
      where: { tenantId: user.tenantId, actionId: existing.id },
    });

    await this.prisma.activity.delete({ where: { id: existing.id } });

    for (const [time, personIds] of personIdsByDate) {
      await this.syncDailyAttendanceForPeopleDate(
        user.tenantId,
        personIds,
        new Date(time),
      );
    }

    return { ok: true as const };
  }

  async addProjectActionComment(
    user: JwtUser,
    projectId: string,
    actionId: string,
    dto: { body: string; mentionUserIds?: string[] | null },
  ) {
    const action = await this.ensureProjectActionExists(
      user,
      projectId,
      actionId,
    );
    const body = dto.body.trim();
    if (!body) {
      throw new BadRequestException('Informe um comentario.');
    }

    const mentionUserIds = await this.resolveMentionUserIds(
      user.tenantId,
      dto.mentionUserIds,
    );

    await this.prisma.projectActionComment.create({
      data: {
        tenantId: user.tenantId,
        actionId: action.id,
        authorUserId: user.userId,
        body,
        mentionUserIds,
      },
    });

    return this.getProjectAction(user, projectId, action.id);
  }

  async deleteProjectActionComment(
    user: JwtUser,
    projectId: string,
    actionId: string,
    commentId: string,
  ) {
    const action = await this.ensureProjectActionExists(
      user,
      projectId,
      actionId,
    );
    const comment = await this.prisma.projectActionComment.findFirst({
      where: { id: commentId, tenantId: user.tenantId, actionId: action.id },
      select: { id: true },
    });
    if (!comment) {
      throw new NotFoundException('Comentario nao encontrado');
    }

    await this.prisma.projectActionComment.delete({
      where: { id: comment.id },
    });
    return this.getProjectAction(user, projectId, action.id);
  }

  async addProjectActionAttachment(
    user: JwtUser,
    projectId: string,
    actionId: string,
    dto: {
      label: string;
      filePath: string;
      mimeType?: string | null;
      fileSizeBytes?: number | null;
    },
  ) {
    const action = await this.ensureProjectActionExists(
      user,
      projectId,
      actionId,
    );
    const label = dto.label.trim();
    const filePath = dto.filePath.trim();

    if (!label) {
      throw new BadRequestException('Informe um nome para o anexo.');
    }

    if (!filePath.startsWith('/uploads/action-attachments/')) {
      throw new BadRequestException('Caminho de anexo invalido.');
    }

    await this.prisma.projectActionAttachment.create({
      data: {
        tenantId: user.tenantId,
        actionId: action.id,
        uploadedByUserId: user.userId,
        label,
        filePath,
        mimeType: normalizeString(dto.mimeType),
        fileSizeBytes: dto.fileSizeBytes ?? null,
      },
    });

    return this.getProjectAction(user, projectId, action.id);
  }

  async deleteProjectActionAttachment(
    user: JwtUser,
    projectId: string,
    actionId: string,
    attachmentId: string,
  ) {
    const action = await this.ensureProjectActionExists(
      user,
      projectId,
      actionId,
    );
    const attachment = await this.prisma.projectActionAttachment.findFirst({
      where: { id: attachmentId, tenantId: user.tenantId, actionId: action.id },
      select: { id: true },
    });
    if (!attachment) {
      throw new NotFoundException('Anexo nao encontrado');
    }

    await this.prisma.projectActionAttachment.delete({
      where: { id: attachment.id },
    });
    return this.getProjectAction(user, projectId, action.id);
  }

  async listActionPeopleGroups(
    user: JwtUser,
    projectId: string,
    actionId: string,
    query: ListActionPeopleGroupsQueryDto,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);
    await this.ensureProjectActionExists(user, projectId, actionId);

    return this.prisma.activityPeopleGroup.findMany({
      where: {
        tenantId: user.tenantId,
        actionId,
        ...(query.participationKind
          ? { participationKind: query.participationKind }
          : {}),
      },
      include: {
        peopleGroup: true,
      },
      orderBy: [{ participationKind: 'asc' }, { peopleGroup: { name: 'asc' } }],
    });
  }

  async createActionPeopleGroup(
    user: JwtUser,
    projectId: string,
    actionId: string,
    dto: CreateActionPeopleGroupDto,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);
    await this.ensureProjectActionExists(user, projectId, actionId);

    await this.ensurePeopleGroupBelongsToProject(
      user.tenantId,
      projectId,
      dto.peopleGroupId,
      dto.participationKind,
    );

    return this.prisma.activityPeopleGroup.create({
      data: {
        tenantId: user.tenantId,
        actionId,
        peopleGroupId: dto.peopleGroupId,
        participationKind: dto.participationKind,
      },
      include: { peopleGroup: true },
    });
  }

  async deleteActionPeopleGroup(
    user: JwtUser,
    projectId: string,
    actionId: string,
    actionPeopleGroupId: string,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);
    await this.ensureProjectActionExists(user, projectId, actionId);

    const existing = await this.prisma.activityPeopleGroup.findFirst({
      where: {
        id: actionPeopleGroupId,
        tenantId: user.tenantId,
        actionId,
      },
      select: { id: true },
    });
    if (!existing)
      throw new NotFoundException('Vinculo do Grupo nao encontrado');

    await this.prisma.activityPeopleGroup.delete({
      where: { id: existing.id },
    });
    return { ok: true as const };
  }

  async listActionOccurrences(
    user: JwtUser,
    projectId: string,
    actionId: string,
    query: ListActionOccurrencesQueryDto,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);
    await this.ensureProjectActionExists(user, projectId, actionId);

    const { page, limit, skip, take } = resolvePagination({
      page: query.page,
      limit: query.limit,
      all: false,
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
    });

    const from = parseDateInput(query.from);
    const to = parseDateInput(query.to, { endOfDay: true });

    const where: Prisma.MeetingWhereInput = {
      tenantId: user.tenantId,
      actionId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.peopleGroupId
        ? { peopleGroups: { some: { peopleGroupId: query.peopleGroupId } } }
        : {}),
      ...(from || to
        ? {
          scheduledDate: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where,
        include: actionOccurrenceInclude,
        orderBy: [{ scheduledDate: 'asc' }, { startTime: 'asc' }],
        skip,
        take,
      }),
      this.prisma.meeting.count({ where }),
    ]);

    return {
      data: data.map((item) => serializeMeeting(item)),
      pagination: buildPaginationMeta({ page, limit, total, isAll: false }),
    };
  }

  async createActionOccurrence(
    user: JwtUser,
    projectId: string,
    actionId: string,
    dto: CreateActionOccurrenceDto,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);
    await this.ensureProjectActionExists(user, projectId, actionId);

    const peopleGroupIds = dto.peopleGroupIds?.length
      ? await this.ensureParticipantPeopleGroupsBelongToAction(
        user.tenantId,
        actionId,
        dto.peopleGroupIds,
      )
      : [];

    const teamPeopleGroupIds = dto.teamPeopleGroupIds?.length
      ? await this.ensureTeamPeopleGroupsBelongToAction(
        user.tenantId,
        actionId,
        dto.teamPeopleGroupIds,
      )
      : [];

    const scheduledDate = parseDateInput(dto.scheduledDate);
    if (!scheduledDate)
      throw new BadRequestException('Data do encontro invalida');

    const startTime = combineDateAndTime(scheduledDate, dto.startTime);
    const endTime = dto.endTime
      ? combineDateAndTime(scheduledDate, dto.endTime)
      : null;
    if (endTime && endTime <= startTime) {
      throw new BadRequestException(
        'Horario de termino deve ser depois do horario de inicio',
      );
    }

    const created = await this.prisma.meeting.create({
      data: {
        tenantId: user.tenantId,
        actionId,
        scheduledDate,
        startTime,
        endTime,
        notes: dto.notes?.trim() ? dto.notes.trim() : null,
        planHtml: normalizeHtml(dto.planHtml) ?? null,
        executedHtml: normalizeHtml(dto.executedHtml) ?? null,
        conclusionHtml: normalizeHtml(dto.conclusionHtml) ?? null,
        photoPaths: (normalizePhotoPaths(dto.photoPaths) as any) ?? null,
        teamPeopleGroups: teamPeopleGroupIds.length
          ? {
            createMany: {
              data: teamPeopleGroupIds.map((peopleGroupId) => ({
                tenantId: user.tenantId,
                peopleGroupId,
              })),
            },
          }
          : undefined,
        peopleGroups: peopleGroupIds.length
          ? {
            createMany: {
              data: peopleGroupIds.map((peopleGroupId) => ({
                tenantId: user.tenantId,
                peopleGroupId,
              })),
            },
          }
          : undefined,
      },
      include: actionOccurrenceInclude,
    });

    return serializeMeeting(created);
  }

  async previewActionOccurrences(
    user: JwtUser,
    projectId: string,
    actionId: string,
    dto: PreviewActionOccurrencesDto,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);
    await this.ensureProjectActionExists(user, projectId, actionId);

    const startDate = parseDateInput(dto.startDate);
    const endDate = parseDateInput(dto.endDate);
    if (!startDate || !endDate) {
      throw new BadRequestException('Periodo do agendamento invalido');
    }
    if (startDate > endDate) {
      throw new BadRequestException(
        'Periodo invalido: inicio maior que termino',
      );
    }

    const dates = generateOccurrenceDates({
      startDate,
      endDate,
      daysOfWeek: dto.daysOfWeek,
    });
    if (dates.length === 0) {
      throw new BadRequestException(
        'Nenhuma data cai nos dias da semana escolhidos dentro do periodo',
      );
    }
    if (dates.length > MAX_BULK_OCCURRENCES) {
      throw new BadRequestException(
        `O agendamento geraria ${dates.length} encontros; o maximo por leva e ${MAX_BULK_OCCURRENCES}. Encurte o periodo.`,
      );
    }

    return { dates: dates.map((date) => toDateOnlyString(date)) };
  }

  async bulkCreateActionOccurrences(
    user: JwtUser,
    projectId: string,
    actionId: string,
    dto: BulkCreateActionOccurrencesDto,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);
    await this.ensureProjectActionExists(user, projectId, actionId);

    const peopleGroupIds = dto.peopleGroupIds?.length
      ? await this.ensureParticipantPeopleGroupsBelongToAction(
        user.tenantId,
        actionId,
        dto.peopleGroupIds,
      )
      : [];

    const teamPeopleGroupIds = dto.teamPeopleGroupIds?.length
      ? await this.ensureTeamPeopleGroupsBelongToAction(
        user.tenantId,
        actionId,
        dto.teamPeopleGroupIds,
      )
      : [];

    const startDate = parseDateInput(dto.startDate);
    const endDate = parseDateInput(dto.endDate);
    if (!startDate || !endDate) {
      throw new BadRequestException('Periodo do agendamento invalido');
    }
    if (startDate > endDate) {
      throw new BadRequestException(
        'Periodo invalido: inicio maior que termino',
      );
    }

    const excludedDates = new Set(dto.excludedDates ?? []);
    const dates = generateOccurrenceDates({
      startDate,
      endDate,
      daysOfWeek: dto.daysOfWeek,
    }).filter((date) => !excludedDates.has(toDateOnlyString(date)));
    if (dates.length === 0) {
      throw new BadRequestException(
        excludedDates.size
          ? 'Nenhuma data restou apos remover as datas excluidas'
          : 'Nenhuma data cai nos dias da semana escolhidos dentro do periodo',
      );
    }
    if (dates.length > MAX_BULK_OCCURRENCES) {
      throw new BadRequestException(
        `O agendamento geraria ${dates.length} encontros; o maximo por leva e ${MAX_BULK_OCCURRENCES}. Encurte o periodo.`,
      );
    }

    const endTimeOfDay = dto.endTime ?? null;
    if (endTimeOfDay) {
      const sample = combineDateAndTime(dates[0], dto.startTime);
      const sampleEnd = combineDateAndTime(dates[0], endTimeOfDay);
      if (sampleEnd <= sample) {
        throw new BadRequestException(
          'Horario de termino deve ser depois do horario de inicio',
        );
      }
    }

    const recurrenceBatchId = randomUUID();
    const notes = dto.notes?.trim() ? dto.notes.trim() : null;
    const planHtml = normalizeHtml(dto.planHtml) ?? null;
    const executedHtml = normalizeHtml(dto.executedHtml) ?? null;
    const conclusionHtml = normalizeHtml(dto.conclusionHtml) ?? null;
    const photoPaths = (normalizePhotoPaths(dto.photoPaths) as any) ?? null;

    await this.prisma.meeting.createMany({
      data: dates.map((scheduledDate) => ({
        tenantId: user.tenantId,
        actionId,
        scheduledDate,
        startTime: combineDateAndTime(scheduledDate, dto.startTime),
        endTime: endTimeOfDay
          ? combineDateAndTime(scheduledDate, endTimeOfDay)
          : null,
        notes,
        planHtml,
        executedHtml,
        conclusionHtml,
        photoPaths,
        recurrenceBatchId,
      })),
    });

    const createdOccurrenceIds =
      teamPeopleGroupIds.length || peopleGroupIds.length
        ? await this.prisma.meeting.findMany({
          where: { tenantId: user.tenantId, actionId, recurrenceBatchId },
          select: { id: true },
        })
        : [];
    if (teamPeopleGroupIds.length && createdOccurrenceIds.length) {
      await this.prisma.actionOccurrenceTeamGroup.createMany({
        data: createdOccurrenceIds.flatMap((occurrence) =>
          teamPeopleGroupIds.map((peopleGroupId) => ({
            tenantId: user.tenantId,
            occurrenceId: occurrence.id,
            peopleGroupId,
          })),
        ),
      });
    }
    if (peopleGroupIds.length && createdOccurrenceIds.length) {
      await this.prisma.actionOccurrencePeopleGroup.createMany({
        data: createdOccurrenceIds.flatMap((occurrence) =>
          peopleGroupIds.map((peopleGroupId) => ({
            tenantId: user.tenantId,
            occurrenceId: occurrence.id,
            peopleGroupId,
          })),
        ),
      });
    }

    const created = await this.prisma.meeting.findMany({
      where: { tenantId: user.tenantId, actionId, recurrenceBatchId },
      include: actionOccurrenceInclude,
      orderBy: [{ scheduledDate: 'asc' }],
    });

    return {
      recurrenceBatchId,
      created: created.length,
      data: created.map((item) => serializeMeeting(item)),
    };
  }

  private async ensureActionOccurrenceExists(
    tenantId: string,
    actionId: string,
    occurrenceId: string,
  ) {
    const occurrence = await this.prisma.meeting.findFirst({
      where: { id: occurrenceId, tenantId, actionId },
      include: { peopleGroups: { select: { peopleGroupId: true } } },
    });
    if (!occurrence) throw new NotFoundException('Encontro nao encontrado');
    return occurrence;
  }

  async updateActionOccurrence(
    user: JwtUser,
    projectId: string,
    actionId: string,
    occurrenceId: string,
    dto: UpdateActionOccurrenceDto,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);
    await this.ensureProjectActionExists(user, projectId, actionId);
    const existing = await this.ensureActionOccurrenceExists(
      user.tenantId,
      actionId,
      occurrenceId,
    );

    const peopleGroupIds =
      dto.peopleGroupIds !== undefined
        ? await this.ensureParticipantPeopleGroupsBelongToAction(
          user.tenantId,
          actionId,
          dto.peopleGroupIds,
        )
        : undefined;

    const teamPeopleGroupIds =
      dto.teamPeopleGroupIds !== undefined
        ? await this.ensureTeamPeopleGroupsBelongToAction(
          user.tenantId,
          actionId,
          dto.teamPeopleGroupIds,
        )
        : undefined;

    const scheduledDate = dto.scheduledDate
      ? parseDateInput(dto.scheduledDate)
      : existing.scheduledDate;
    if (dto.scheduledDate && !scheduledDate) {
      throw new BadRequestException('Data do encontro invalida');
    }
    const baseDate = scheduledDate ?? existing.scheduledDate;

    const startTime = dto.startTime
      ? combineDateAndTime(baseDate, dto.startTime)
      : dto.scheduledDate
        ? combineDateAndTime(baseDate, toTimeOfDay(existing.startTime))
        : existing.startTime;
    const endTime =
      dto.endTime === null
        ? null
        : dto.endTime
          ? combineDateAndTime(baseDate, dto.endTime)
          : existing.endTime && dto.scheduledDate
            ? combineDateAndTime(baseDate, toTimeOfDay(existing.endTime))
            : existing.endTime;

    if (endTime && endTime <= startTime) {
      throw new BadRequestException(
        'Horario de termino deve ser depois do horario de inicio',
      );
    }

    const planHtml = normalizeHtml(dto.planHtml);
    const executedHtml = normalizeHtml(dto.executedHtml);
    const conclusionHtml = normalizeHtml(dto.conclusionHtml);
    const photoPaths = normalizePhotoPaths(dto.photoPaths);

    const updated = await this.prisma.meeting.update({
      where: { id: existing.id },
      data: {
        scheduledDate: baseDate,
        startTime,
        endTime,
        status: dto.status ?? undefined,
        notes:
          dto.notes === undefined
            ? undefined
            : dto.notes === null
              ? null
              : dto.notes.trim()
                ? dto.notes.trim()
                : null,
        ...(planHtml !== undefined ? { planHtml } : {}),
        ...(executedHtml !== undefined ? { executedHtml } : {}),
        ...(conclusionHtml !== undefined ? { conclusionHtml } : {}),
        ...(photoPaths !== undefined
          ? { photoPaths: (photoPaths as any) ?? null }
          : {}),
      },
    });

    if (teamPeopleGroupIds !== undefined) {
      const current = await this.prisma.actionOccurrenceTeamGroup.findMany({
        where: { tenantId: user.tenantId, occurrenceId: existing.id },
        select: { id: true, peopleGroupId: true },
      });
      const toRemove = current.filter(
        (row) => !teamPeopleGroupIds.includes(row.peopleGroupId),
      );
      const toAdd = teamPeopleGroupIds.filter(
        (peopleGroupId) =>
          !current.some((row) => row.peopleGroupId === peopleGroupId),
      );
      await this.prisma.$transaction([
        ...(toRemove.length
          ? [
            this.prisma.actionOccurrenceTeamGroup.deleteMany({
              where: { id: { in: toRemove.map((row) => row.id) } },
            }),
          ]
          : []),
        ...(toAdd.length
          ? [
            this.prisma.actionOccurrenceTeamGroup.createMany({
              data: toAdd.map((peopleGroupId) => ({
                tenantId: user.tenantId,
                occurrenceId: existing.id,
                peopleGroupId,
              })),
            }),
          ]
          : []),
      ]);
    }

    if (peopleGroupIds !== undefined) {
      const current = await this.prisma.actionOccurrencePeopleGroup.findMany({
        where: { tenantId: user.tenantId, occurrenceId: existing.id },
        select: { id: true, peopleGroupId: true },
      });
      const toRemove = current.filter(
        (row) => !peopleGroupIds.includes(row.peopleGroupId),
      );
      const toAdd = peopleGroupIds.filter(
        (peopleGroupId) =>
          !current.some((row) => row.peopleGroupId === peopleGroupId),
      );
      await this.prisma.$transaction([
        ...(toRemove.length
          ? [
            this.prisma.actionOccurrencePeopleGroup.deleteMany({
              where: { id: { in: toRemove.map((row) => row.id) } },
            }),
          ]
          : []),
        ...(toAdd.length
          ? [
            this.prisma.actionOccurrencePeopleGroup.createMany({
              data: toAdd.map((peopleGroupId) => ({
                tenantId: user.tenantId,
                occurrenceId: existing.id,
                peopleGroupId,
              })),
            }),
          ]
          : []),
      ]);
    }

    const result = await this.prisma.meeting.findFirst({
      where: { id: updated.id },
      include: actionOccurrenceInclude,
    });
    return result ? serializeMeeting(result) : result;
  }

  async updateActionOccurrenceBatch(
    user: JwtUser,
    projectId: string,
    actionId: string,
    recurrenceBatchId: string,
    dto: UpdateActionOccurrenceBatchDto,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);
    await this.ensureProjectActionExists(user, projectId, actionId);

    const fromDate = dto.fromDate ? parseDateInput(dto.fromDate) : null;
    if (dto.fromDate && !fromDate) {
      throw new BadRequestException('Data inicial invalida');
    }

    const where: Prisma.MeetingWhereInput = {
      tenantId: user.tenantId,
      actionId,
      recurrenceBatchId,
      ...(fromDate ? { scheduledDate: { gte: fromDate } } : {}),
    };

    const existing = await this.prisma.meeting.count({ where });
    if (existing === 0) {
      throw new NotFoundException('Leva de encontros nao encontrada');
    }

    const result = await this.prisma.meeting.updateMany({
      where,
      data: { status: dto.status },
    });

    return { ok: true as const, updated: result.count };
  }

  async deleteActionOccurrence(
    user: JwtUser,
    projectId: string,
    actionId: string,
    occurrenceId: string,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);
    await this.ensureProjectActionExists(user, projectId, actionId);
    const existing = await this.ensureActionOccurrenceExists(
      user.tenantId,
      actionId,
      occurrenceId,
    );

    // Fase 3: capturar quem tinha presenca PRESENT neste encontro antes de
    // apagar, para reavaliar a presenca diaria depois (pode ser que essa
    // fosse a unica presenca da pessoa naquele dia).
    const presentAttendances = await this.prisma.meetingAttendance.findMany({
      where: {
        tenantId: user.tenantId,
        occurrenceId: existing.id,
        status: 'PRESENT',
      },
      select: { enrollment: { select: { personId: true } } },
    });

    // As FKs de MeetingAttendance/ActionOccurrenceTeamGroup/
    // ActionOccurrencePeopleGroup.occurrenceId sao RESTRICT (mesmo padrao
    // manual de cascade ja usado em deleteActivity) - sem isso, excluir um
    // encontro com presenca ou grupos vinculados falharia com erro de FK.
    await this.prisma.meetingAttendance.deleteMany({
      where: { tenantId: user.tenantId, occurrenceId: existing.id },
    });
    await this.prisma.actionOccurrenceTeamGroup.deleteMany({
      where: { tenantId: user.tenantId, occurrenceId: existing.id },
    });
    await this.prisma.actionOccurrencePeopleGroup.deleteMany({
      where: { tenantId: user.tenantId, occurrenceId: existing.id },
    });
    await this.prisma.meeting.delete({ where: { id: existing.id } });

    await this.syncDailyAttendanceForPeopleDate(
      user.tenantId,
      presentAttendances.map((row) => row.enrollment.personId),
      existing.scheduledDate,
    );

    return { ok: true as const };
  }

  async listProjectActionPeopleParticipations(
    user: JwtUser,
    projectId: string,
    actionId: string,
    query: ListProjectActionPeopleParticipationsQueryDto,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);
    await this.ensureProjectActionExists(user, projectId, actionId);

    const { page, limit, skip, take } = resolvePagination({
      page: query.page,
      limit: query.limit,
      all: false,
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
    });

    const q = normalizeString(query.q);
    const where: Prisma.ProjectActionPeopleParticipationWhereInput = {
      tenantId: user.tenantId,
      actionId,
      isActive: true,
      deletedAt: null,
      ...(query.role ? { role: query.role } : {}),
      ...(q
        ? {
          OR: [
            { person: { fullName: { contains: q } } },
            { person: { socialName: { contains: q } } },
            { enrollment: { person: { status: { contains: q } } } },
          ],
        }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.projectActionPeopleParticipation.findMany({
        where,
        include: {
          person: {
            select: {
              id: true,
              fullName: true,
              socialName: true,
              birthDate: true,
              status: true,
              avatarUrl: true,
              sex: true,
              gender: true,
              raceColor: true,
              peopleGroupParticipations: {
                where: { isActive: true, deletedAt: null },
                select: {
                  peopleGroup: {
                    select: {
                      id: true,
                      name: true,
                      category: true,
                    },
                  },
                },
              },
              _count: { select: { healthConditions: true, medications: true } },
            },
          },
          enrollment: {
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
                  peopleGroupParticipations: {
                    where: { isActive: true, deletedAt: null },
                    select: {
                      peopleGroup: {
                        select: {
                          id: true,
                          name: true,
                          category: true,
                        },
                      },
                    },
                  },
                  _count: {
                    select: { healthConditions: true, medications: true },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ role: 'asc' }, { person: { fullName: 'asc' } }],
        skip,
        take,
      }),
      this.prisma.projectActionPeopleParticipation.count({ where }),
    ]);

    return {
      data: data.map((row) => ({
        ...row,
        person: {
          ...row.person,
          hasHealthCondition: (row.person._count.healthConditions ?? 0) > 0,
          hasMedication: (row.person._count.medications ?? 0) > 0,
          _count: undefined,
        },
        enrollment: row.enrollment
          ? this.serializeEnrollment(row.enrollment as any)
          : null,
      })),
      pagination: buildPaginationMeta({ page, limit, total, isAll: false }),
    };
  }

  async listEligibleProjectActionPeople(
    user: JwtUser,
    projectId: string,
    actionId: string,
    query: ListEligibleProjectActionPeopleQueryDto,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);
    await this.ensureProjectActionExists(user, projectId, actionId);

    const { page, limit, skip, take } = resolvePagination({
      page: query.page,
      limit: query.limit,
      all: false,
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
    });

    const q = normalizeString(query.q);
    const filters = parseAdvancedFilters(query.filters);
    const participationKind: ParticipationKind =
      query.participationKind ?? 'TEAM';
    const actionPeopleGroups = await this.prisma.activityPeopleGroup.findMany({
      where: {
        tenantId: user.tenantId,
        actionId,
        participationKind,
      },
      select: { peopleGroupId: true },
      distinct: ['peopleGroupId'],
    });
    let scopedPeopleGroupIds = actionPeopleGroups.map(
      (row) => row.peopleGroupId,
    );
    if (!scopedPeopleGroupIds.length) {
      const projectPeopleGroups = await this.prisma.projectPeopleGroup.findMany(
        {
          where: {
            tenantId: user.tenantId,
            projectId,
            participationKind,
          },
          select: { peopleGroupId: true },
          distinct: ['peopleGroupId'],
        },
      );
      scopedPeopleGroupIds = projectPeopleGroups.map(
        (row) => row.peopleGroupId,
      );
    }
    const personBaseWhere = buildPeopleWhere({
      tenantId: user.tenantId,
      query: q ?? undefined,
      filters,
    });
    const peopleGroupScope: Prisma.PersonWhereInput | null =
      scopedPeopleGroupIds.length
        ? {
          peopleGroupParticipations: {
            some: {
              tenantId: user.tenantId,
              peopleGroupId: { in: scopedPeopleGroupIds },
              isActive: true,
              deletedAt: null,
            },
          },
        }
        : null;
    const where: Prisma.ProjectEnrollmentWhereInput = {
      tenantId: user.tenantId,
      projectId,
      participationKind,
      status: 'ACTIVE',
      deletedAt: null,
      actionPeopleParticipations: {
        none: {
          tenantId: user.tenantId,
          actionId,
          isActive: true,
          deletedAt: null,
        },
      },
      person:
        peopleGroupScope !== null
          ? { AND: [personBaseWhere, peopleGroupScope] }
          : personBaseWhere,
    };

    const [data, total] = await Promise.all([
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
              peopleGroupParticipations: {
                where: { isActive: true, deletedAt: null },
                select: {
                  peopleGroup: {
                    select: {
                      id: true,
                      name: true,
                      category: true,
                    },
                  },
                },
              },
              _count: { select: { healthConditions: true, medications: true } },
            },
          },
        },
        orderBy: [{ person: { fullName: 'asc' } }],
        skip,
        take,
      }),
      this.prisma.projectEnrollment.count({ where }),
    ]);

    return {
      data: data.map((enrollment) =>
        this.serializeEnrollment(enrollment as any),
      ),
      pagination: buildPaginationMeta({ page, limit, total, isAll: false }),
    };
  }

  async createProjectActionPeopleParticipation(
    user: JwtUser,
    projectId: string,
    actionId: string,
    dto: CreateProjectActionPeopleParticipationDto,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);
    await this.ensureProjectActionExists(user, projectId, actionId);

    const person = await this.prisma.person.findFirst({
      where: { id: dto.personId, tenantId: user.tenantId },
      select: { id: true },
    });
    if (!person) throw new BadRequestException('Pessoa invalida');

    let enrollmentId: string | null = null;
    if (dto.enrollmentId) {
      const enrollment = await this.prisma.projectEnrollment.findFirst({
        where: {
          id: dto.enrollmentId,
          tenantId: user.tenantId,
          projectId,
          personId: dto.personId,
          participationKind: dto.participationKind ?? 'TEAM',
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!enrollment) {
        throw new BadRequestException('Participacao no projeto invalida');
      }
      enrollmentId = enrollment.id;
    } else {
      const activeEnrollment = await this.prisma.projectEnrollment.findFirst({
        where: {
          tenantId: user.tenantId,
          projectId,
          personId: dto.personId,
          participationKind: dto.participationKind ?? 'TEAM',
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: { id: true },
      });
      enrollmentId = activeEnrollment?.id ?? null;
    }

    const role: ActionPeopleParticipationRole = dto.role ?? 'PARTICIPANTE';
    const activeKey = `${actionId}:${dto.personId}:${role}`;
    const startsAt = parseDateInput(dto.startsAt) ?? new Date();

    const existing =
      await this.prisma.projectActionPeopleParticipation.findFirst({
        where: {
          tenantId: user.tenantId,
          actionId,
          personId: dto.personId,
          role,
          isActive: true,
          deletedAt: null,
        },
        select: { id: true },
      });
    if (existing) {
      throw new BadRequestException(
        'Pessoa ja esta vinculada a esta acao com esse papel.',
      );
    }

    return this.prisma.projectActionPeopleParticipation
      .create({
        data: {
          tenantId: user.tenantId,
          actionId,
          personId: dto.personId,
          enrollmentId,
          participationKind: dto.participationKind ?? 'TEAM',
          role,
          activeKey,
          isActive: true,
          startsAt,
          internalNotes: dto.internalNotes?.trim()
            ? dto.internalNotes.trim()
            : null,
        },
        include: {
          person: {
            select: {
              id: true,
              fullName: true,
              socialName: true,
              birthDate: true,
              status: true,
              avatarUrl: true,
              sex: true,
              gender: true,
              raceColor: true,
              peopleGroupParticipations: {
                where: { isActive: true, deletedAt: null },
                select: {
                  peopleGroup: {
                    select: {
                      id: true,
                      name: true,
                      category: true,
                    },
                  },
                },
              },
              _count: { select: { healthConditions: true, medications: true } },
            },
          },
          enrollment: {
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
                  peopleGroupParticipations: {
                    where: { isActive: true, deletedAt: null },
                    select: {
                      peopleGroup: {
                        select: {
                          id: true,
                          name: true,
                          category: true,
                        },
                      },
                    },
                  },
                  _count: {
                    select: { healthConditions: true, medications: true },
                  },
                },
              },
            },
          },
        },
      })
      .then((row) => ({
        ...row,
        person: {
          ...row.person,
          hasHealthCondition: (row.person._count.healthConditions ?? 0) > 0,
          hasMedication: (row.person._count.medications ?? 0) > 0,
          _count: undefined,
        },
        enrollment: row.enrollment
          ? this.serializeEnrollment(row.enrollment as any)
          : null,
      }));
  }

  async endProjectActionPeopleParticipation(
    user: JwtUser,
    projectId: string,
    actionId: string,
    participationId: string,
    dto: EndProjectActionPeopleParticipationDto,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);
    await this.ensureProjectActionExists(user, projectId, actionId);

    const existing =
      await this.prisma.projectActionPeopleParticipation.findFirst({
        where: { id: participationId, tenantId: user.tenantId, actionId },
        select: { id: true, internalNotes: true, deletedAt: true },
      });
    if (!existing)
      throw new NotFoundException('Participacao da acao nao encontrada');
    if (existing.deletedAt) return { ok: true as const };

    const endsAt = parseDateInput(dto.endsAt, { endOfDay: true }) ?? new Date();
    const noteSuffix = dto.internalNotes?.trim()
      ? dto.internalNotes.trim()
      : null;

    await this.prisma.projectActionPeopleParticipation.update({
      where: { id: existing.id },
      data: {
        activeKey: null,
        isActive: false,
        endsAt,
        deletedAt: new Date(),
        internalNotes: noteSuffix
          ? [existing.internalNotes?.trim(), noteSuffix]
            .filter(Boolean)
            .join('\n\n')
          : existing.internalNotes,
      },
    });

    return { ok: true as const };
  }

  async listProjectActionAttendances(
    user: JwtUser,
    projectId: string,
    actionId: string,
    occurrenceId: string,
    query: ListProjectActionAttendancesQueryDto,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);
    const action = await this.ensureProjectActionExists(
      user,
      projectId,
      actionId,
    );
    const occurrence = await this.ensureActionOccurrenceExists(
      user.tenantId,
      actionId,
      occurrenceId,
    );

    const { page, limit, skip, take } = resolvePagination({
      page: query.page,
      limit: query.limit,
      all: false,
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
    });

    const q = normalizeString(query.q);
    // O encontro pode ter seus proprios grupos-alvo (ex.: a atividade atende
    // 3 grupos, mas este encontro especifico e so pros grupos A e B) -
    // prevalece sobre os grupos da atividade quando presente.
    const occurrencePeopleGroupIds = occurrence.peopleGroups.map(
      (row) => row.peopleGroupId,
    );
    const scopedPeopleGroupIds = occurrencePeopleGroupIds.length
      ? occurrencePeopleGroupIds
      : ((action.peopleGroupIds as string[] | undefined) ?? []);

    const where: Prisma.ProjectEnrollmentWhereInput = {
      tenantId: user.tenantId,
      projectId,
      status: 'ACTIVE',
      ...(action.targetEnrollmentId ? { id: action.targetEnrollmentId } : {}),
      ...(q
        ? {
          OR: [
            { person: { fullName: { contains: q } } },
            {
              person: {
                peopleGroupParticipations: {
                  some: {
                    tenantId: user.tenantId,
                    isActive: true,
                    deletedAt: null,
                    peopleGroup: { name: { contains: q } },
                  },
                },
              },
            },
          ],
        }
        : {}),
      ...(scopedPeopleGroupIds.length
        ? {
          person: {
            peopleGroupParticipations: {
              some: {
                tenantId: user.tenantId,
                peopleGroupId: { in: scopedPeopleGroupIds },
                isActive: true,
                deletedAt: null,
              },
            },
          },
        }
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
              peopleGroupParticipations: {
                where: { isActive: true, deletedAt: null },
                select: {
                  peopleGroup: {
                    select: {
                      id: true,
                      name: true,
                      category: true,
                    },
                  },
                },
              },
              _count: { select: { healthConditions: true, medications: true } },
            },
          },
        },
        orderBy: [{ person: { fullName: 'asc' } }],
        skip,
        take,
      }),
      this.prisma.projectEnrollment.count({ where }),
    ]);

    const attendanceRows = await this.prisma.meetingAttendance.findMany({
      where: {
        tenantId: user.tenantId,
        occurrenceId,
        enrollmentId: { in: enrollments.map((row) => row.id) },
        ...(query.status ? { status: query.status } : {}),
      },
      select: {
        id: true,
        enrollmentId: true,
        status: true,
        notes: true,
        qualityScore: true,
        qualityNotes: true,
        isHighlight: true,
        updatedAt: true,
      },
    });

    const attendanceByEnrollment = new Map(
      attendanceRows.map((row) => [row.enrollmentId, row]),
    );

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
        peopleGroupId: (action.peopleGroupId as string | null) ?? null,
        targetEnrollmentId: action.targetEnrollmentId ?? null,
      },
      occurrence: {
        id: occurrence.id,
        scheduledDate: occurrence.scheduledDate,
        status: occurrence.status,
        peopleGroupId: occurrencePeopleGroupIds[0] ?? null,
      },
      data,
      pagination: buildPaginationMeta({ page, limit, total, isAll: false }),
    };
  }

  /**
   * Resumo agregado por pessoa (aba "Participantes" da Atividade): soma
   * todos os Encontros (nao so 1, como `listProjectActionAttendances`) para
   * dar frequencia (%), media de avaliacao e contagem de ocorrencias
   * (hardcoded 0 ate a Fase 5/Ocorrencia existir). So leitura - a edicao de
   * presenca em si fica na aba "Presenca" do dialogo do Encontro.
   */
  async listProjectActionAttendanceSummary(
    user: JwtUser,
    projectId: string,
    actionId: string,
    query: ListProjectActionAttendanceSummaryQueryDto,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);
    const action = await this.ensureProjectActionExists(
      user,
      projectId,
      actionId,
    );

    const { page, limit, skip, take } = resolvePagination({
      page: query.page,
      limit: query.limit,
      all: false,
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
    });

    const q = normalizeString(query.q);
    const from = parseDateInput(query.from);
    const to = parseDateInput(query.to, { endOfDay: true });
    const scopedPeopleGroupIds = (action.peopleGroupIds as string[]) ?? [];

    const where: Prisma.ProjectEnrollmentWhereInput = {
      tenantId: user.tenantId,
      projectId,
      status: 'ACTIVE',
      ...(action.targetEnrollmentId ? { id: action.targetEnrollmentId } : {}),
      ...(q
        ? {
          OR: [
            { person: { fullName: { contains: q } } },
            {
              person: {
                peopleGroupParticipations: {
                  some: {
                    tenantId: user.tenantId,
                    isActive: true,
                    deletedAt: null,
                    peopleGroup: { name: { contains: q } },
                  },
                },
              },
            },
          ],
        }
        : {}),
      ...(scopedPeopleGroupIds.length
        ? {
          person: {
            peopleGroupParticipations: {
              some: {
                tenantId: user.tenantId,
                peopleGroupId: { in: scopedPeopleGroupIds },
                isActive: true,
                deletedAt: null,
              },
            },
          },
        }
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
              peopleGroupParticipations: {
                where: { isActive: true, deletedAt: null },
                select: {
                  peopleGroup: {
                    select: { id: true, name: true, category: true },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ person: { fullName: 'asc' } }],
        skip,
        take,
      }),
      this.prisma.projectEnrollment.count({ where }),
    ]);

    const meetings = await this.prisma.meeting.findMany({
      where: {
        tenantId: user.tenantId,
        actionId,
        status: { not: 'CANCELED' },
        ...(from || to
          ? {
            scheduledDate: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
          : {}),
      },
      select: {
        id: true,
        peopleGroups: { select: { peopleGroupId: true } },
      },
    });

    if (!meetings.length || !enrollments.length) {
      return {
        action: { id: action.id, title: action.title },
        data: enrollments.map((enrollment) => ({
          enrollment: this.serializeEnrollment(enrollment as any),
          totalMeetings: 0,
          presentCount: 0,
          attendanceRate: null as number | null,
          averageQuality: null as number | null,
          occurrencesCount: 0,
        })),
        pagination: buildPaginationMeta({ page, limit, total, isAll: false }),
      };
    }

    const personIds = enrollments.map((row) => row.personId);
    const personGroupRows = await this.prisma.peopleGroupParticipation.findMany(
      {
        where: {
          tenantId: user.tenantId,
          personId: { in: personIds },
          isActive: true,
          deletedAt: null,
        },
        select: { personId: true, peopleGroupId: true },
      },
    );
    const groupIdsByPerson = new Map<string, Set<string>>();
    for (const row of personGroupRows) {
      const set = groupIdsByPerson.get(row.personId) ?? new Set<string>();
      set.add(row.peopleGroupId);
      groupIdsByPerson.set(row.personId, set);
    }

    const isEligibleForMeeting = (
      personId: string,
      meeting: { peopleGroups: { peopleGroupId: string }[] },
    ) => {
      if (!meeting.peopleGroups.length) return true;
      const personGroupIds =
        groupIdsByPerson.get(personId) ?? new Set<string>();
      return meeting.peopleGroups.some((row) =>
        personGroupIds.has(row.peopleGroupId),
      );
    };

    const attendanceRows = await this.prisma.meetingAttendance.findMany({
      where: {
        tenantId: user.tenantId,
        occurrenceId: { in: meetings.map((row) => row.id) },
        enrollmentId: { in: enrollments.map((row) => row.id) },
      },
      select: {
        enrollmentId: true,
        occurrenceId: true,
        status: true,
        qualityScore: true,
      },
    });
    const attendanceByEnrollment = new Map<string, typeof attendanceRows>();
    for (const row of attendanceRows) {
      const list = attendanceByEnrollment.get(row.enrollmentId) ?? [];
      list.push(row);
      attendanceByEnrollment.set(row.enrollmentId, list);
    }

    const data = enrollments.map((enrollment) => {
      const eligibleMeetings = meetings.filter((meeting) =>
        isEligibleForMeeting(enrollment.personId, meeting),
      );
      const totalMeetings = eligibleMeetings.length;
      const attendanceRowsForEnrollment =
        attendanceByEnrollment.get(enrollment.id) ?? [];
      const attendanceByMeeting = new Map(
        attendanceRowsForEnrollment.map((row) => [row.occurrenceId, row]),
      );

      let presentCount = 0;
      let scoreSum = 0;
      let scoreCount = 0;
      for (const meeting of eligibleMeetings) {
        const attendance = attendanceByMeeting.get(meeting.id);
        if (!attendance) continue;
        if (attendance.status === 'PRESENT') presentCount += 1;
        if (
          attendance.qualityScore !== null &&
          attendance.qualityScore !== undefined
        ) {
          scoreSum += attendance.qualityScore;
          scoreCount += 1;
        }
      }

      return {
        enrollment: this.serializeEnrollment(enrollment as any),
        totalMeetings,
        presentCount,
        attendanceRate: totalMeetings > 0 ? presentCount / totalMeetings : null,
        averageQuality: scoreCount > 0 ? scoreSum / scoreCount : null,
        occurrencesCount: 0,
      };
    });

    return {
      action: { id: action.id, title: action.title },
      data,
      pagination: buildPaginationMeta({ page, limit, total, isAll: false }),
    };
  }

  async upsertProjectActionAttendances(
    user: JwtUser,
    projectId: string,
    actionId: string,
    occurrenceId: string,
    dto: UpsertProjectActionAttendancesDto,
  ) {
    await this.ensureProjectExists(user.tenantId, projectId);
    await this.ensureProjectActionExists(user, projectId, actionId);
    const occurrence = await this.ensureActionOccurrenceExists(
      user.tenantId,
      actionId,
      occurrenceId,
    );

    const items = dto.items ?? [];
    if (items.length === 0)
      return { ok: true as const, created: 0, updated: 0 };

    const enrollmentIds = Array.from(
      new Set(items.map((item) => item.enrollmentId)),
    );
    const enrollments = await this.prisma.projectEnrollment.findMany({
      where: { tenantId: user.tenantId, projectId, id: { in: enrollmentIds } },
      select: { id: true, personId: true },
    });
    if (enrollments.length !== enrollmentIds.length) {
      throw new BadRequestException('Matricula invalida');
    }
    const personIdByEnrollment = new Map(
      enrollments.map((enrollment) => [enrollment.id, enrollment.personId]),
    );

    const existing = await this.prisma.meetingAttendance.findMany({
      where: {
        tenantId: user.tenantId,
        occurrenceId,
        enrollmentId: { in: enrollmentIds },
      },
      select: { id: true, enrollmentId: true },
    });
    const existingByEnrollment = new Map(
      existing.map((row) => [row.enrollmentId, row.id]),
    );

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

          const existingId =
            existingByEnrollment.get(item.enrollmentId) ?? null;

          if (existingId) {
            await this.prisma.meetingAttendance.update({
              where: { id: existingId },
              data: {
                status: item.status,
                ...(notes !== undefined ? { notes } : {}),
                ...(item.qualityScore !== undefined
                  ? { qualityScore: item.qualityScore ?? null }
                  : {}),
                ...(qualityNotes !== undefined ? { qualityNotes } : {}),
                ...(item.isHighlight !== undefined
                  ? { isHighlight: item.isHighlight }
                  : {}),
              },
            });
            updated += 1;
            return;
          }

          await this.prisma.meetingAttendance.create({
            data: {
              tenantId: user.tenantId,
              actionId,
              occurrenceId,
              enrollmentId: item.enrollmentId,
              status: item.status,
              notes: notes === undefined ? null : notes,
              qualityScore: item.qualityScore ?? null,
              qualityNotes: qualityNotes === undefined ? null : qualityNotes,
              isHighlight: item.isHighlight ?? false,
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

    const affectedPersonIds = items
      .map((item) => personIdByEnrollment.get(item.enrollmentId))
      .filter((personId): personId is string => Boolean(personId));
    await this.syncDailyAttendanceForPeopleDate(
      user.tenantId,
      affectedPersonIds,
      occurrence.scheduledDate,
    );

    return { ok: true as const, created, updated };
  }

  private async resolveMentionUserIds(
    tenantId: string,
    mentionUserIds?: string[] | null,
  ) {
    const normalized = Array.from(
      new Set(
        (mentionUserIds ?? []).map((entry) => entry.trim()).filter(Boolean),
      ),
    );

    if (!normalized.length) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        id: { in: normalized },
      },
      select: { id: true },
    });

    return users.map((user) => user.id);
  }
}
