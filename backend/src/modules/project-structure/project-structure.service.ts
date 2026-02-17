import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { EnrollmentStatus, Prisma } from '../../generated/prisma';
import { PrismaService } from '../../core/prisma/prisma.service';
import { parseDateInput } from '../../core/utils/dates';
import { buildPaginationMeta, resolvePagination } from '../../core/utils/pagination';
import { normalizeString } from '../../core/utils/strings';
import { CreateProjectCycleDto } from './dto/create-project-cycle.dto';
import { CreateProjectEnrollmentDto } from './dto/create-project-enrollment.dto';
import { CreateProjectGroupDto } from './dto/create-project-group.dto';
import { ListProjectEnrollmentsQueryDto } from './dto/list-project-enrollments-query.dto';
import { UpdateProjectCycleDto } from './dto/update-project-cycle.dto';
import { UpdateProjectEnrollmentDto } from './dto/update-project-enrollment.dto';
import { UpdateProjectGroupDto } from './dto/update-project-group.dto';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

function ensureValidPeriod(params: { startsAt?: Date | null; endsAt?: Date | null }) {
  const startsAt = params.startsAt ?? null;
  const endsAt = params.endsAt ?? null;
  if (startsAt && endsAt && startsAt > endsAt) {
    throw new BadRequestException('Período inválido: início maior que término');
  }
}

@Injectable()
export class ProjectStructureService {
  constructor(private readonly prisma: PrismaService) {}

  private serializeEnrollment<T extends { groupMemberships?: any[]; cycleParticipations?: any[] }>(
    enrollment: T,
  ) {
    const groups = (enrollment.groupMemberships ?? []).map((m) => m.group);
    const cycle = (enrollment.cycleParticipations ?? [])[0]?.cycle ?? null;
    return {
      ...enrollment,
      groups,
      cycle,
      groupMemberships: undefined,
      cycleParticipations: undefined,
    };
  }

  private async ensureProjectExists(tenantId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Projeto não encontrado');
  }

  async listGroups(tenantId: string, projectId: string) {
    await this.ensureProjectExists(tenantId, projectId);
    return this.prisma.projectGroup.findMany({
      where: { tenantId, projectId },
      orderBy: { name: 'asc' },
    });
  }

  async createGroup(tenantId: string, projectId: string, dto: CreateProjectGroupDto) {
    await this.ensureProjectExists(tenantId, projectId);
    const name = (dto.name ?? '').trim();
    if (!name) throw new BadRequestException('Nome é obrigatório');
    return this.prisma.projectGroup.create({
      data: {
        tenantId,
        projectId,
        name,
        description: dto.description?.trim() ? dto.description.trim() : null,
      },
    });
  }

  async updateGroup(
    tenantId: string,
    projectId: string,
    groupId: string,
    dto: UpdateProjectGroupDto,
  ) {
    const existing = await this.prisma.projectGroup.findFirst({
      where: { id: groupId, tenantId, projectId },
    });
    if (!existing) throw new NotFoundException('Grupo não encontrado');

    const name = dto.name !== undefined ? (dto.name ?? '').trim() : undefined;
    if (name !== undefined && !name) {
      throw new BadRequestException('Nome é obrigatório');
    }

    return this.prisma.projectGroup.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() ? dto.description.trim() : null }
          : {}),
      },
    });
  }

  async deleteGroup(tenantId: string, projectId: string, groupId: string) {
    const existing = await this.prisma.projectGroup.findFirst({
      where: { id: groupId, tenantId, projectId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Grupo não encontrado');

    const membershipsCount = await this.prisma.projectEnrollmentGroupMembership.count({
      where: { tenantId, groupId: existing.id },
    });
    if (membershipsCount > 0) {
      throw new BadRequestException(
        'Não é possível excluir o grupo: existem participantes vinculados',
      );
    }

    await this.prisma.projectGroup.delete({ where: { id: existing.id } });
    return { ok: true as const };
  }

  async listCycles(tenantId: string, projectId: string) {
    await this.ensureProjectExists(tenantId, projectId);
    return this.prisma.projectCycle.findMany({
      where: { tenantId, projectId },
      orderBy: { name: 'asc' },
    });
  }

  async createCycle(tenantId: string, projectId: string, dto: CreateProjectCycleDto) {
    await this.ensureProjectExists(tenantId, projectId);
    const name = (dto.name ?? '').trim();
    if (!name) throw new BadRequestException('Nome é obrigatório');

    const startsAt = parseDateInput(dto.startsAt);
    const endsAt = parseDateInput(dto.endsAt);
    ensureValidPeriod({ startsAt, endsAt });

    return this.prisma.projectCycle.create({
      data: {
        tenantId,
        projectId,
        name,
        startsAt,
        endsAt,
      },
    });
  }

  async updateCycle(
    tenantId: string,
    projectId: string,
    cycleId: string,
    dto: UpdateProjectCycleDto,
  ) {
    const existing = await this.prisma.projectCycle.findFirst({
      where: { id: cycleId, tenantId, projectId },
    });
    if (!existing) throw new NotFoundException('Ciclo não encontrado');

    const name = dto.name !== undefined ? (dto.name ?? '').trim() : undefined;
    if (name !== undefined && !name) {
      throw new BadRequestException('Nome é obrigatório');
    }

    const startsAt =
      dto.startsAt !== undefined ? parseDateInput(dto.startsAt) : existing.startsAt;
    const endsAt =
      dto.endsAt !== undefined ? parseDateInput(dto.endsAt) : existing.endsAt;
    ensureValidPeriod({ startsAt, endsAt });

    return this.prisma.projectCycle.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(dto.startsAt !== undefined ? { startsAt } : {}),
        ...(dto.endsAt !== undefined ? { endsAt } : {}),
      },
    });
  }

  async deleteCycle(tenantId: string, projectId: string, cycleId: string) {
    const existing = await this.prisma.projectCycle.findFirst({
      where: { id: cycleId, tenantId, projectId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Ciclo não encontrado');

    const participationsCount =
      await this.prisma.projectEnrollmentCycleParticipation.count({
        where: { tenantId, cycleId: existing.id },
    });
    if (participationsCount > 0) {
      throw new BadRequestException(
        'Não é possível excluir o ciclo: existem participantes vinculados',
      );
    }

    await this.prisma.projectCycle.delete({ where: { id: existing.id } });
    return { ok: true as const };
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
    const and: Prisma.ProjectEnrollmentWhereInput[] = [];
    if (query.excludeGroupId) {
      and.push({
        NOT: {
          groupMemberships: {
            some: { isActive: true, groupId: query.excludeGroupId },
          },
        },
      });
    }
    if (query.excludeCycleId) {
      and.push({
        NOT: {
          cycleParticipations: {
            some: { isActive: true, cycleId: query.excludeCycleId },
          },
        },
      });
    }

    const where: Prisma.ProjectEnrollmentWhereInput = {
      tenantId,
      projectId,
      ...(query.status ? { status: query.status as EnrollmentStatus } : {}),
      ...(query.groupId
        ? {
            groupMemberships: {
              some: { isActive: true, groupId: query.groupId },
            },
          }
        : {}),
      ...(query.cycleId
        ? {
            cycleParticipations: {
              some: { isActive: true, cycleId: query.cycleId },
            },
          }
        : {}),
      ...(and.length ? { AND: and } : {}),
      ...(q
        ? {
            OR: [
              { person: { fullName: { contains: q } } },
              { groupMemberships: { some: { isActive: true, group: { name: { contains: q } } } } },
              { cycleParticipations: { some: { isActive: true, cycle: { name: { contains: q } } } } },
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

  private async ensurePersonBelongsToTenant(tenantId: string, personId: string) {
    const person = await this.prisma.person.findFirst({
      where: { id: personId, tenantId },
      select: { id: true },
    });
    if (!person) throw new BadRequestException('Pessoa inválida');
  }

  private async ensureGroupBelongsToProject(
    tenantId: string,
    projectId: string,
    groupId: string,
  ) {
    const group = await this.prisma.projectGroup.findFirst({
      where: { id: groupId, tenantId, projectId },
      select: { id: true },
    });
    if (!group) throw new BadRequestException('Grupo inválido');
  }

  private async ensureCycleBelongsToProject(
    tenantId: string,
    projectId: string,
    cycleId: string,
  ) {
    const cycle = await this.prisma.projectCycle.findFirst({
      where: { id: cycleId, tenantId, projectId },
      select: { id: true },
    });
    if (!cycle) throw new BadRequestException('Ciclo inválido');
  }

  private async ensureEnrollmentBelongsToProject(params: {
    tenantId: string;
    projectId: string;
    enrollmentId: string;
  }) {
    const enrollment = await this.prisma.projectEnrollment.findFirst({
      where: {
        id: params.enrollmentId,
        tenantId: params.tenantId,
        projectId: params.projectId,
      },
      select: { id: true, personId: true },
    });
    if (!enrollment) throw new NotFoundException('Matrícula não encontrada');
    return enrollment;
  }

  async addEnrollmentToGroup(
    tenantId: string,
    projectId: string,
    enrollmentId: string,
    groupId: string,
  ) {
    await this.ensureProjectExists(tenantId, projectId);
    await this.ensureGroupBelongsToProject(tenantId, projectId, groupId);
    await this.ensureEnrollmentBelongsToProject({ tenantId, projectId, enrollmentId });

    const existing = await this.prisma.projectEnrollmentGroupMembership.findFirst({
      where: { tenantId, enrollmentId, groupId, isActive: true },
      select: { id: true },
    });
    if (existing) {
      return { ok: true as const };
    }

    try {
      await this.prisma.projectEnrollmentGroupMembership.create({
        data: {
          tenantId,
          enrollmentId,
          groupId,
          activeKey: `${enrollmentId}:${groupId}`,
          isActive: true,
          startsAt: new Date(),
        },
      });
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err && (err as any).code === 'P2002') {
        return { ok: true as const };
      }
      throw err;
    }

    return { ok: true as const };
  }

  async removeEnrollmentFromGroup(
    tenantId: string,
    projectId: string,
    enrollmentId: string,
    groupId: string,
  ) {
    await this.ensureProjectExists(tenantId, projectId);
    await this.ensureGroupBelongsToProject(tenantId, projectId, groupId);
    await this.ensureEnrollmentBelongsToProject({ tenantId, projectId, enrollmentId });

    await this.prisma.projectEnrollmentGroupMembership.updateMany({
      where: { tenantId, enrollmentId, groupId, isActive: true },
      data: {
        activeKey: null,
        isActive: false,
        endsAt: new Date(),
      },
    });

    return { ok: true as const };
  }

  async setEnrollmentCycle(
    tenantId: string,
    projectId: string,
    enrollmentId: string,
    cycleId: string | null,
  ) {
    await this.ensureProjectExists(tenantId, projectId);
    if (cycleId) {
      await this.ensureCycleBelongsToProject(tenantId, projectId, cycleId);
    }
    await this.ensureEnrollmentBelongsToProject({ tenantId, projectId, enrollmentId });

    const current = await this.prisma.projectEnrollmentCycleParticipation.findFirst({
      where: { tenantId, enrollmentId, isActive: true },
      select: { id: true, cycleId: true },
    });

    if (cycleId && current?.cycleId === cycleId) {
      return { ok: true as const };
    }

    const now = new Date();
    const operations: Prisma.PrismaPromise<any>[] = [
      this.prisma.projectEnrollmentCycleParticipation.updateMany({
        where: { tenantId, enrollmentId, isActive: true },
        data: { activeKey: null, isActive: false, endsAt: now },
      }),
    ];

    if (cycleId) {
      operations.push(
        this.prisma.projectEnrollmentCycleParticipation.create({
          data: {
            tenantId,
            enrollmentId,
            cycleId,
            activeKey: enrollmentId,
            isActive: true,
            startsAt: now,
          },
        }),
      );
    }

    try {
      await this.prisma.$transaction(operations);
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err && (err as any).code === 'P2002') {
        throw new BadRequestException('Pessoa já está em um ciclo ativo.');
      }
      throw err;
    }

    return { ok: true as const };
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
        ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException(
        'Pessoa já está vinculada ao projeto (matrícula ativa).',
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
        startsAt,
        endsAt,
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
    if (!existing) throw new NotFoundException('Matrícula não encontrada');

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
    });

    return this.serializeEnrollment(enrollment);
  }

  async deleteEnrollment(tenantId: string, projectId: string, enrollmentId: string) {
    const existing = await this.prisma.projectEnrollment.findFirst({
      where: { id: enrollmentId, tenantId, projectId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Matrícula não encontrada');

    await this.prisma.projectEnrollment.delete({ where: { id: existing.id } });
    return { ok: true as const };
  }
}
