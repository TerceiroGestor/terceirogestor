import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  EnrollmentStatus,
  ParticipationKind,
  Prisma,
  ProjectParticipationRole,
} from '../../generated/prisma';
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
import { CreateGoalDto } from './dto/create-goal.dto';
import { CreateProjectEnrollmentDto } from './dto/create-project-enrollment.dto';
import { CreateProjectFundingSourceDto } from './dto/create-project-funding-source.dto';
import { CreateProjectPeopleGroupDto } from './dto/create-project-people-group.dto';
import { ListEligibleProjectPeopleQueryDto } from './dto/list-eligible-project-people-query.dto';
import { ListProjectEnrollmentsQueryDto } from './dto/list-project-enrollments-query.dto';
import { ListProjectPeopleGroupsQueryDto } from './dto/list-project-people-groups-query.dto';
import { SyncPeopleGroupEnrollmentsDto } from './dto/sync-people-group-enrollments.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { UpdateProjectEnrollmentDto } from './dto/update-project-enrollment.dto';
import { UpdateProjectFundingSourceDto } from './dto/update-project-funding-source.dto';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

function ensureValidPeriod(params: {
  startsAt?: Date | null;
  endsAt?: Date | null;
}) {
  const startsAt = params.startsAt ?? null;
  const endsAt = params.endsAt ?? null;
  if (startsAt && endsAt && startsAt > endsAt) {
    throw new BadRequestException(
      'PerÃ­odo invÃ¡lido: inÃ­cio maior que tÃ©rmino',
    );
  }
}

@Injectable()
export class ProjectStructureService {
  constructor(private readonly prisma: PrismaService) { }

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

  private async getPeopleGroup(tenantId: string, peopleGroupId: string) {
    const peopleGroup = await this.prisma.peopleGroup.findFirst({
      where: { id: peopleGroupId, tenantId },
      select: {
        id: true,
        name: true,
        groupType: true,
        category: true,
        ageMin: true,
        ageMax: true,
        isActive: true,
      },
    });
    if (!peopleGroup)
      throw new BadRequestException('Grupo invalido');
    return peopleGroup;
  }

  private async ensureProjectExists(tenantId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Projeto nÃ£o encontrado');
  }

  async listPeopleGroups(
    tenantId: string,
    projectId: string,
    query: ListProjectPeopleGroupsQueryDto,
  ) {
    await this.ensureProjectExists(tenantId, projectId);
    return this.prisma.projectPeopleGroup.findMany({
      where: {
        tenantId,
        projectId,
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

  async createPeopleGroup(
    tenantId: string,
    projectId: string,
    dto: CreateProjectPeopleGroupDto,
  ) {
    await this.ensureProjectExists(tenantId, projectId);
    await this.getPeopleGroup(tenantId, dto.peopleGroupId);

    const existing = await this.prisma.projectPeopleGroup.findFirst({
      where: {
        tenantId,
        projectId,
        peopleGroupId: dto.peopleGroupId,
        participationKind: dto.participationKind,
      },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException(
        'Grupo ja esta vinculado ao projeto com essa finalidade.',
      );
    }

    return this.prisma.projectPeopleGroup.create({
      data: {
        tenantId,
        projectId,
        peopleGroupId: dto.peopleGroupId,
        participationKind: dto.participationKind,
      },
      include: { peopleGroup: true },
    });
  }

  async deletePeopleGroup(
    tenantId: string,
    projectId: string,
    projectPeopleGroupId: string,
  ) {
    const existing = await this.prisma.projectPeopleGroup.findFirst({
      where: { id: projectPeopleGroupId, tenantId, projectId },
      select: { id: true, peopleGroupId: true, participationKind: true },
    });
    if (!existing)
      throw new NotFoundException('Vinculo do Grupo nao encontrado');

    const actionsCount = await this.prisma.activityPeopleGroup.count({
      where: {
        tenantId,
        peopleGroupId: existing.peopleGroupId,
        participationKind: existing.participationKind,
        action: { projectId },
      },
    });
    if (actionsCount > 0) {
      throw new BadRequestException(
        'Nao e possivel remover o Grupo: existem acoes vinculadas',
      );
    }

    await this.prisma.projectPeopleGroup.delete({ where: { id: existing.id } });
    return { ok: true as const };
  }

  async listFundingSources(tenantId: string, projectId: string) {
    await this.ensureProjectExists(tenantId, projectId);
    return this.prisma.projectFundingSource.findMany({
      where: { tenantId, projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createFundingSource(
    tenantId: string,
    projectId: string,
    dto: CreateProjectFundingSourceDto,
  ) {
    await this.ensureProjectExists(tenantId, projectId);
    return this.prisma.projectFundingSource.create({
      data: {
        tenantId,
        projectId,
        source: dto.source,
        name: normalizeString(dto.name),
        notes: normalizeString(dto.notes),
      },
    });
  }

  async updateFundingSource(
    tenantId: string,
    projectId: string,
    fundingSourceId: string,
    dto: UpdateProjectFundingSourceDto,
  ) {
    const existing = await this.prisma.projectFundingSource.findFirst({
      where: { id: fundingSourceId, tenantId, projectId },
      select: { id: true },
    });
    if (!existing)
      throw new NotFoundException('Fonte de financiamento nao encontrada');

    return this.prisma.projectFundingSource.update({
      where: { id: existing.id },
      data: {
        ...(dto.source !== undefined ? { source: dto.source } : {}),
        ...(dto.name !== undefined ? { name: normalizeString(dto.name) } : {}),
        ...(dto.notes !== undefined
          ? { notes: normalizeString(dto.notes) }
          : {}),
      },
    });
  }

  async deleteFundingSource(
    tenantId: string,
    projectId: string,
    fundingSourceId: string,
  ) {
    const existing = await this.prisma.projectFundingSource.findFirst({
      where: { id: fundingSourceId, tenantId, projectId },
      select: { id: true },
    });
    if (!existing)
      throw new NotFoundException('Fonte de financiamento nao encontrada');

    await this.prisma.projectFundingSource.delete({
      where: { id: existing.id },
    });
    return { ok: true as const };
  }

  async listGoals(tenantId: string, projectId: string) {
    await this.ensureProjectExists(tenantId, projectId);
    return this.prisma.goal.findMany({
      where: { tenantId, projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createGoal(tenantId: string, projectId: string, dto: CreateGoalDto) {
    await this.ensureProjectExists(tenantId, projectId);
    const title = (dto.title ?? '').trim();
    if (!title) throw new BadRequestException('Titulo da meta e obrigatorio');

    return this.prisma.goal.create({
      data: {
        tenantId,
        projectId,
        title,
        description: normalizeString(dto.description),
      },
    });
  }

  async updateGoal(
    tenantId: string,
    projectId: string,
    goalId: string,
    dto: UpdateGoalDto,
  ) {
    const existing = await this.prisma.goal.findFirst({
      where: { id: goalId, tenantId, projectId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Meta nao encontrada');

    const title =
      dto.title !== undefined ? (dto.title ?? '').trim() : undefined;
    if (title !== undefined && !title) {
      throw new BadRequestException('Titulo da meta e obrigatorio');
    }

    return this.prisma.goal.update({
      where: { id: existing.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(dto.description !== undefined
          ? { description: normalizeString(dto.description) }
          : {}),
      },
    });
  }

  async deleteGoal(tenantId: string, projectId: string, goalId: string) {
    const existing = await this.prisma.goal.findFirst({
      where: { id: goalId, tenantId, projectId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Meta nao encontrada');

    const activitiesCount = await this.prisma.activity.count({
      where: { tenantId, goalId: existing.id },
    });
    if (activitiesCount > 0) {
      throw new BadRequestException(
        'Nao e possivel remover a meta: existem atividades vinculadas',
      );
    }

    await this.prisma.goal.delete({ where: { id: existing.id } });
    return { ok: true as const };
  }

  async syncPeopleGroupEnrollments(
    tenantId: string,
    projectId: string,
    peopleGroupId: string,
    dto: SyncPeopleGroupEnrollmentsDto,
  ) {
    await this.ensureProjectExists(tenantId, projectId);

    const projectPeopleGroup = await this.prisma.projectPeopleGroup.findFirst({
      where: {
        tenantId,
        projectId,
        peopleGroupId,
        participationKind: 'PARTICIPANT',
      },
      select: { id: true },
    });
    if (!projectPeopleGroup) {
      throw new BadRequestException(
        'Grupo nao esta vinculado a este projeto como grupo de participantes.',
      );
    }

    const role: ProjectParticipationRole = dto.role ?? 'PUBLICO_ATENDIDO';

    const toEnroll = await this.prisma.person.findMany({
      where: {
        tenantId,
        peopleGroupParticipations: {
          some: { tenantId, peopleGroupId, isActive: true, deletedAt: null },
        },
        projectEnrollments: {
          none: {
            tenantId,
            projectId,
            participationKind: 'PARTICIPANT',
            status: 'ACTIVE',
            deletedAt: null,
          },
        },
      },
      select: { id: true, fullName: true },
      orderBy: { fullName: 'asc' },
    });

    const toEnd = await this.prisma.projectEnrollment.findMany({
      where: {
        tenantId,
        projectId,
        participationKind: 'PARTICIPANT',
        status: 'ACTIVE',
        deletedAt: null,
        person: {
          peopleGroupParticipations: { some: { tenantId, peopleGroupId } },
          NOT: {
            peopleGroupParticipations: {
              some: {
                tenantId,
                peopleGroupId,
                isActive: true,
                deletedAt: null,
              },
            },
          },
        },
      },
      select: {
        id: true,
        personId: true,
        person: { select: { fullName: true } },
      },
      orderBy: { person: { fullName: 'asc' } },
    });

    const now = new Date();
    const transactionOps: Prisma.PrismaPromise<any>[] = [
      ...toEnroll.map((person) =>
        this.prisma.projectEnrollment.create({
          data: {
            tenantId,
            projectId,
            personId: person.id,
            status: 'ACTIVE',
            participationKind: 'PARTICIPANT',
            role,
            startsAt: now,
            endsAt: null,
            deletedAt: null,
          },
          select: { id: true, personId: true },
        }),
      ),
      ...(toEnd.length
        ? [
          this.prisma.projectEnrollment.updateMany({
            where: { id: { in: toEnd.map((enrollment) => enrollment.id) } },
            data: { status: 'ENDED', endsAt: now },
          }),
        ]
        : []),
    ];

    const transactionResults =
      transactionOps.length > 0
        ? await this.prisma.$transaction(transactionOps)
        : [];
    const createdEnrollments = transactionResults.slice(
      0,
      toEnroll.length,
    ) as Array<{
      id: string;
      personId: string;
    }>;
    const fullNameByPersonId = new Map(
      toEnroll.map((person) => [person.id, person.fullName]),
    );

    return {
      enrolled: createdEnrollments.map((enrollment) => ({
        id: enrollment.id,
        personId: enrollment.personId,
        fullName: fullNameByPersonId.get(enrollment.personId) ?? '',
      })),
      ended: toEnd.map((enrollment) => ({
        id: enrollment.id,
        personId: enrollment.personId,
        fullName: enrollment.person.fullName,
      })),
    };
  }

  async listEnrollments(
    tenantId: string,
    projectId: string,
    query: ListProjectEnrollmentsQueryDto,
  ) {
    await this.ensureProjectExists(tenantId, projectId);
    const { page, limit, skip, take, isAll } = resolvePagination({
      page: query.page,
      limit: query.limit,
      all: false,
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
    });

    const q = normalizeString(query.q);
    const filters = parseAdvancedFilters(query.filters);
    const personWhere = buildPeopleWhere({
      tenantId,
      query: undefined,
      filters,
    });
    const scopedPeopleGroupId = query.peopleGroupId ?? null;
    const excludedPeopleGroupId = query.excludePeopleGroupId ?? null;
    const and: Prisma.ProjectEnrollmentWhereInput[] = [];
    if (excludedPeopleGroupId) {
      and.push({
        NOT: {
          person: {
            peopleGroupParticipations: {
              some: {
                tenantId,
                peopleGroupId: excludedPeopleGroupId,
                isActive: true,
                deletedAt: null,
              },
            },
          },
        },
      });
    }

    const where: Prisma.ProjectEnrollmentWhereInput = {
      tenantId,
      projectId,
      deletedAt: null,
      ...(query.status ? { status: query.status as EnrollmentStatus } : {}),
      ...(scopedPeopleGroupId
        ? {
          person: {
            AND: [
              personWhere,
              {
                peopleGroupParticipations: {
                  some: {
                    tenantId,
                    peopleGroupId: scopedPeopleGroupId,
                    isActive: true,
                    deletedAt: null,
                  },
                },
              },
            ],
          },
        }
        : { person: personWhere }),
      ...(and.length ? { AND: and } : {}),
      ...(q
        ? {
          OR: [
            { person: { fullName: { contains: q } } },
            { person: { socialName: { contains: q } } },
            { person: { personType: { contains: q } } },
            { person: { status: { contains: q } } },
            {
              person: {
                peopleGroupParticipations: {
                  some: {
                    tenantId,
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
        orderBy: { createdAt: 'desc' },
        ...(isAll ? {} : { skip, take }),
      }),
      this.prisma.projectEnrollment.count({ where }),
    ]);

    return {
      data: data.map((enrollment) => this.serializeEnrollment(enrollment)),
      pagination: buildPaginationMeta({ page, limit, total, isAll }),
    };
  }

  async listEligiblePeople(
    tenantId: string,
    projectId: string,
    query: ListEligibleProjectPeopleQueryDto,
  ) {
    await this.ensureProjectExists(tenantId, projectId);

    const { page, limit, skip, take } = resolvePagination({
      page: query.page,
      limit: query.limit,
      all: false,
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
    });

    const filters = parseAdvancedFilters(query.filters);
    const projectPeopleGroups = await this.prisma.projectPeopleGroup.findMany({
      where: {
        tenantId,
        projectId,
        participationKind: 'PARTICIPANT',
      },
      select: { peopleGroupId: true },
      distinct: ['peopleGroupId'],
    });

    const projectPeopleGroupIds = projectPeopleGroups.map(
      (row) => row.peopleGroupId,
    );
    if (projectPeopleGroupIds.length === 0) {
      return {
        data: [],
        pagination: buildPaginationMeta({
          page,
          limit,
          total: 0,
          isAll: false,
        }),
      };
    }

    const requestedPeopleGroupId = query.peopleGroupId ?? null;
    const effectivePeopleGroupIds =
      requestedPeopleGroupId === null
        ? projectPeopleGroupIds
        : projectPeopleGroupIds.includes(requestedPeopleGroupId)
          ? [requestedPeopleGroupId]
          : [];

    if (effectivePeopleGroupIds.length === 0) {
      return {
        data: [],
        pagination: buildPaginationMeta({
          page,
          limit,
          total: 0,
          isAll: false,
        }),
      };
    }

    const q = normalizeString(query.q);
    const basePeopleWhere = buildPeopleWhere({
      tenantId,
      query: undefined,
      filters,
    });
    const where: Prisma.PersonWhereInput = {
      ...basePeopleWhere,
      peopleGroupParticipations: {
        some: {
          tenantId,
          peopleGroupId: { in: effectivePeopleGroupIds },
          isActive: true,
          deletedAt: null,
        },
      },
      projectEnrollments: {
        none: {
          tenantId,
          projectId,
          participationKind: 'PARTICIPANT',
          status: 'ACTIVE',
          deletedAt: null,
        },
      },
      ...(q
        ? {
          OR: [
            { fullName: { contains: q } },
            { socialName: { contains: q } },
            { status: { contains: q } },
            { personType: { contains: q } },
            {
              peopleGroupParticipations: {
                some: {
                  peopleGroupId: { in: effectivePeopleGroupIds },
                  peopleGroup: { name: { contains: q } },
                },
              },
            },
            {
              peopleGroupParticipations: {
                some: {
                  peopleGroupId: { in: effectivePeopleGroupIds },
                  peopleGroup: { category: { contains: q } },
                },
              },
            },
          ],
        }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.person.findMany({
        where,
        select: {
          id: true,
          tenantId: true,
          fullName: true,
          socialName: true,
          birthDate: true,
          sex: true,
          gender: true,
          raceColor: true,
          maritalStatus: true,
          nationality: true,
          email: true,
          phone: true,
          document: true,
          rg: true,
          nis: true,
          status: true,
          personType: true,
          departureReason: true,
          notes: true,
          tags: true,
          profileSummary: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          peopleGroupParticipations: {
            where: {
              tenantId,
              peopleGroupId: { in: effectivePeopleGroupIds },
              isActive: true,
              deletedAt: null,
            },
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
        orderBy: [{ fullName: 'asc' }],
        skip,
        take,
      }),
      this.prisma.person.count({ where }),
    ]);

    return {
      data: data.map((person) => ({
        ...person,
        eligiblePeopleGroups: person.peopleGroupParticipations
          .map((participation) => participation.peopleGroup)
          .filter((peopleGroup) => Boolean(peopleGroup)),
        hasHealthCondition: (person._count.healthConditions ?? 0) > 0,
        hasMedication: (person._count.medications ?? 0) > 0,
        peopleGroupParticipations: undefined,
        _count: undefined,
      })),
      pagination: buildPaginationMeta({ page, limit, total, isAll: false }),
    };
  }

  private async ensurePersonBelongsToTenant(
    tenantId: string,
    personId: string,
  ) {
    const person = await this.prisma.person.findFirst({
      where: { id: personId, tenantId },
      select: { id: true },
    });
    if (!person) throw new BadRequestException('Pessoa invÃ¡lida');
  }

  private async ensureNoActiveEnrollment(params: {
    tenantId: string;
    projectId: string;
    personId: string;
    excludeId?: string;
  }) {
    const existing = await this.prisma.projectEnrollment.findFirst({
      where: {
        tenantId: params.tenantId,
        projectId: params.projectId,
        personId: params.personId,
        status: 'ACTIVE',
        deletedAt: null,
        ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
      },
      select: { id: true, endsAt: true, deletedAt: true },
    });
    if (existing) {
      throw new BadRequestException(
        'Pessoa jÃ¡ estÃ¡ vinculada ao projeto (matrÃ­cula ativa).',
      );
    }
  }

  async createEnrollment(
    tenantId: string,
    projectId: string,
    dto: CreateProjectEnrollmentDto,
  ) {
    await this.ensureProjectExists(tenantId, projectId);
    await this.ensurePersonBelongsToTenant(tenantId, dto.personId);

    const endsAt = parseDateInput(dto.endsAt);
    const today = new Date().toISOString().slice(0, 10);
    const defaultStartsAt = parseDateInput(today);
    const startsAt = parseDateInput(dto.startsAt) ?? endsAt ?? defaultStartsAt;
    ensureValidPeriod({ startsAt, endsAt });

    const status: EnrollmentStatus = dto.status ?? 'ACTIVE';
    const role: ProjectParticipationRole = dto.role ?? 'PUBLICO_ATENDIDO';
    const participationKind: ParticipationKind =
      dto.participationKind ?? 'PARTICIPANT';
    if (status === 'ACTIVE') {
      await this.ensureNoActiveEnrollment({
        tenantId,
        projectId,
        personId: dto.personId,
      });
    }

    const enrollment = await this.prisma.projectEnrollment.create({
      data: {
        tenantId,
        projectId,
        personId: dto.personId,
        status,
        participationKind,
        role,
        startsAt,
        endsAt,
        deletedAt: null,
      },
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
    });

    return this.serializeEnrollment(enrollment);
  }

  async updateEnrollment(
    tenantId: string,
    projectId: string,
    enrollmentId: string,
    dto: UpdateProjectEnrollmentDto,
  ) {
    const existing = await this.prisma.projectEnrollment.findFirst({
      where: { id: enrollmentId, tenantId, projectId },
    });
    if (!existing) throw new NotFoundException('MatrÃ­cula nÃ£o encontrada');
    if (existing.deletedAt)
      throw new NotFoundException('MatrÃ­cula nÃ£o encontrada');

    const startsAt =
      dto.startsAt === undefined
        ? existing.startsAt
        : dto.startsAt === null
          ? null
          : (parseDateInput(dto.startsAt) ?? null);
    const endsAt =
      dto.endsAt === undefined
        ? existing.endsAt
        : dto.endsAt === null
          ? null
          : (parseDateInput(dto.endsAt) ?? null);

    const nextStatus: EnrollmentStatus | undefined =
      dto.status !== undefined ? dto.status : undefined;

    const shouldAutoSetEndsAt =
      nextStatus === 'ENDED' &&
      dto.endsAt === undefined &&
      (existing.endsAt === null || existing.endsAt === undefined);
    const resolvedEndsAt = shouldAutoSetEndsAt
      ? (parseDateInput(new Date().toISOString().slice(0, 10), {
        endOfDay: true,
      }) ?? null)
      : endsAt;

    ensureValidPeriod({ startsAt, endsAt: resolvedEndsAt });
    if (nextStatus === 'ACTIVE') {
      await this.ensureNoActiveEnrollment({
        tenantId,
        projectId,
        personId: existing.personId,
        excludeId: existing.id,
      });
    }

    const shouldUpdateEndsAt = dto.endsAt !== undefined || shouldAutoSetEndsAt;

    const enrollment = await this.prisma.projectEnrollment.update({
      where: { id: existing.id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.participationKind !== undefined
          ? { participationKind: dto.participationKind }
          : {}),
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        ...(dto.startsAt !== undefined ? { startsAt } : {}),
        ...(shouldUpdateEndsAt ? { endsAt: resolvedEndsAt } : {}),
      },
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
    });

    return this.serializeEnrollment(enrollment);
  }

  async deleteEnrollment(
    tenantId: string,
    projectId: string,
    enrollmentId: string,
  ) {
    const existing = await this.prisma.projectEnrollment.findFirst({
      where: { id: enrollmentId, tenantId, projectId },
      select: { id: true, endsAt: true, deletedAt: true },
    });
    if (!existing) throw new NotFoundException('MatrÃ­cula nÃ£o encontrada');

    if (existing.deletedAt) {
      return { ok: true as const };
    }

    const now = new Date();
    await this.prisma.projectEnrollment.update({
      where: { id: existing.id },
      data: {
        status: 'ENDED',
        endsAt: existing.endsAt ?? now,
        deletedAt: now,
      },
    });
    return { ok: true as const };
  }
}
