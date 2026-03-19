import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, ProgramType, ProjectStatus } from '../../generated/prisma';
import { PrismaService } from '../../core/prisma/prisma.service';
import { parseDateInput } from '../../core/utils/dates';
import { buildPaginationMeta, resolvePagination } from '../../core/utils/pagination';
import { normalizeString } from '../../core/utils/strings';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;
const PROJECT_STATUS_SEARCH_MAP: Record<string, ProjectStatus[]> = {
  planned: ['PLANNED'],
  planejado: ['PLANNED'],
  planejados: ['PLANNED'],
  active: ['ACTIVE'],
  ativo: ['ACTIVE'],
  ativos: ['ACTIVE'],
  closed: ['CLOSED'],
  encerrado: ['CLOSED'],
  encerrados: ['CLOSED'],
};
const PROGRAM_TYPE_SEARCH_MAP: Record<string, ProgramType[]> = {
  scfv: ['SCFV'],
  paif: ['PAIF'],
  paefi: ['PAEFI'],
  cultural: ['CULTURAL'],
  cultura: ['CULTURAL'],
  qualification: ['QUALIFICATION'],
  qualificacao: ['QUALIFICATION'],
  other: ['OTHER'],
  outro: ['OTHER'],
  outros: ['OTHER'],
};

function resolveMatchingProjectStatuses(query: string): ProjectStatus[] {
  const tokens = query
    .split(/\s+/)
    .map((token) => normalizeString(token))
    .filter(Boolean);
  const matches = new Set<ProjectStatus>();
  for (const token of tokens) {
    if (!token) continue;
    for (const status of PROJECT_STATUS_SEARCH_MAP[token] ?? []) {
      matches.add(status);
    }
  }
  return Array.from(matches);
}

function resolveMatchingProgramTypes(query: string): ProgramType[] {
  const tokens = query
    .split(/\s+/)
    .map((token) => normalizeString(token))
    .filter(Boolean);
  const matches = new Set<ProgramType>();
  for (const token of tokens) {
    if (!token) continue;
    for (const type of PROGRAM_TYPE_SEARCH_MAP[token] ?? []) {
      matches.add(type);
    }
  }
  return Array.from(matches);
}

function ensureValidPeriod(params: { startsAt?: Date | null; endsAt?: Date | null }) {
  const startsAt = params.startsAt ?? null;
  const endsAt = params.endsAt ?? null;
  if (startsAt && endsAt && startsAt > endsAt) {
    throw new BadRequestException('Período inválido: início maior que término');
  }
}

function resolveRangeDates(params: { from?: string; to?: string }) {
  const from = parseDateInput(params.from);
  const to = parseDateInput(params.to);
  if (from && to && from > to) {
    throw new BadRequestException('Intervalo de datas inválido');
  }
  return { from, to };
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProjects(tenantId: string, query: ListProjectsQueryDto) {
    const { page, limit, skip, take, isAll } = resolvePagination({
      page: query.page,
      limit: query.limit,
      all: query.all,
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
    });

    const q = normalizeString(query.q);
    const matchingStatuses = q ? resolveMatchingProjectStatuses(q) : [];
    const matchingProgramTypes = q ? resolveMatchingProgramTypes(q) : [];
    const searchedDate = query.q ? parseDateInput(query.q) : null;
    const { from, to } = resolveRangeDates({ from: query.from, to: query.to });

    const where: Prisma.ProjectWhereInput = {
      tenantId,
      ...(query.programId ? { programId: query.programId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { description: { contains: q } },
              { internalNotes: { contains: q } },
              { status: { in: matchingStatuses } },
              ...(searchedDate
                ? [{ startsAt: { equals: searchedDate } }, { endsAt: { equals: searchedDate } }]
                : []),
              { program: { name: { contains: q } } },
              { program: { type: { in: matchingProgramTypes } } },
            ],
          }
        : {}),
      ...(from ? { startsAt: { gte: from } } : {}),
      ...(to ? { endsAt: { lte: to } } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        include: {
          program: { select: { id: true, name: true, type: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...(isAll ? {} : { skip, take }),
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data,
      pagination: buildPaginationMeta({ page, limit, total, isAll }),
    };
  }

  async getProject(tenantId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, tenantId },
      include: {
        program: { select: { id: true, name: true, type: true, status: true } },
      },
    });
    if (!project) throw new NotFoundException('Projeto não encontrado');
    return project;
  }

  private async ensureProgramBelongsToTenant(tenantId: string, programId: string) {
    const program = await this.prisma.program.findFirst({
      where: { id: programId, tenantId },
      select: { id: true },
    });
    if (!program) throw new BadRequestException('Programa inválido');
  }

  async createProject(tenantId: string, dto: CreateProjectDto) {
    const name = (dto.name ?? '').trim();
    if (!name) throw new BadRequestException('Nome é obrigatório');

    await this.ensureProgramBelongsToTenant(tenantId, dto.programId);

    const startsAt = parseDateInput(dto.startsAt);
    const endsAt = parseDateInput(dto.endsAt);
    ensureValidPeriod({ startsAt, endsAt });

    return this.prisma.project.create({
      data: {
        tenantId,
        programId: dto.programId,
        name,
        description: dto.description?.trim() ? dto.description.trim() : null,
        internalNotes: dto.internalNotes?.trim() ? dto.internalNotes.trim() : null,
        status: dto.status ?? 'PLANNED',
        startsAt,
        endsAt,
      },
      include: {
        program: { select: { id: true, name: true, type: true, status: true } },
      },
    });
  }

  async updateProject(tenantId: string, id: string, dto: UpdateProjectDto) {
    const existing = await this.prisma.project.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Projeto não encontrado');

    if (dto.programId !== undefined) {
      await this.ensureProgramBelongsToTenant(tenantId, dto.programId);
    }

    const name =
      dto.name !== undefined ? (dto.name ?? '').trim() : undefined;
    if (name !== undefined && !name) {
      throw new BadRequestException('Nome é obrigatório');
    }

    const startsAt =
      dto.startsAt !== undefined ? parseDateInput(dto.startsAt) : existing.startsAt;
    const endsAt =
      dto.endsAt !== undefined ? parseDateInput(dto.endsAt) : existing.endsAt;
    ensureValidPeriod({ startsAt, endsAt });

    return this.prisma.project.update({
      where: { id: existing.id },
      data: {
        ...(dto.programId !== undefined ? { programId: dto.programId } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() ? dto.description.trim() : null }
          : {}),
        ...(dto.internalNotes !== undefined
          ? {
              internalNotes: dto.internalNotes?.trim()
                ? dto.internalNotes.trim()
                : null,
            }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.startsAt !== undefined ? { startsAt } : {}),
        ...(dto.endsAt !== undefined ? { endsAt } : {}),
      },
      include: {
        program: { select: { id: true, name: true, type: true, status: true } },
      },
    });
  }

  async deleteProject(tenantId: string, id: string) {
    const existing = await this.prisma.project.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Projeto não encontrado');

    const [groupsCount, cyclesCount, enrollmentsCount] =
      await this.prisma.$transaction([
        this.prisma.projectGroup.count({
          where: { tenantId, projectId: existing.id },
        }),
        this.prisma.projectCycle.count({
          where: { tenantId, projectId: existing.id },
        }),
        this.prisma.projectEnrollment.count({
          where: { tenantId, projectId: existing.id },
        }),
      ]);

    if (groupsCount > 0 || cyclesCount > 0 || enrollmentsCount > 0) {
      throw new BadRequestException(
        'Não é possível excluir o projeto: existem grupos/ciclos/participantes vinculados',
      );
    }

    await this.prisma.project.delete({ where: { id: existing.id } });
    return { ok: true as const };
  }
}
