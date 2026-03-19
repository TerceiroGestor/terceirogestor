import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, ProgramStatus, ProgramType } from '../../generated/prisma';
import { PrismaService } from '../../core/prisma/prisma.service';
import { parseDateInput } from '../../core/utils/dates';
import { buildPaginationMeta, resolvePagination } from '../../core/utils/pagination';
import { normalizeString } from '../../core/utils/strings';
import { CreateProgramDto } from './dto/create-program.dto';
import { ListProgramsQueryDto } from './dto/list-programs-query.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;
const PROGRAM_TYPE_SEARCH_MAP: Array<{ value: ProgramType; tokens: string[] }> = [
  { value: 'SCFV', tokens: ['scfv'] },
  { value: 'PAIF', tokens: ['paif'] },
  { value: 'PAEFI', tokens: ['paefi'] },
  { value: 'CULTURAL', tokens: ['cultural', 'cultura'] },
  { value: 'QUALIFICATION', tokens: ['qualification', 'qualificacao', 'qualificação'] },
  { value: 'OTHER', tokens: ['other', 'outro'] },
];
const PROGRAM_STATUS_SEARCH_MAP: Array<{ value: ProgramStatus; tokens: string[] }> = [
  { value: 'PLANNED', tokens: ['planned', 'planejado'] },
  { value: 'ACTIVE', tokens: ['active', 'ativo'] },
  { value: 'CLOSED', tokens: ['closed', 'encerrado'] },
];

function resolveRangeDates(params: { from?: string; to?: string }) {
  const from = parseDateInput(params.from);
  const to = parseDateInput(params.to);
  if (from && to && from > to) {
    throw new BadRequestException('Intervalo de datas inválido');
  }
  return { from, to };
}

function ensureValidPeriod(params: { startsAt?: Date | null; endsAt?: Date | null }) {
  const startsAt = params.startsAt ?? null;
  const endsAt = params.endsAt ?? null;
  if (startsAt && endsAt && startsAt > endsAt) {
    throw new BadRequestException('Período inválido: início maior que término');
  }
}

function resolveMatchingProgramTypes(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return PROGRAM_TYPE_SEARCH_MAP.filter((entry) =>
    entry.tokens.some((token) => token.includes(normalized) || normalized.includes(token)),
  ).map((entry) => entry.value);
}

function resolveMatchingProgramStatuses(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return PROGRAM_STATUS_SEARCH_MAP.filter((entry) =>
    entry.tokens.some((token) => token.includes(normalized) || normalized.includes(token)),
  ).map((entry) => entry.value);
}

@Injectable()
export class ProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPrograms(tenantId: string, query: ListProgramsQueryDto) {
    const { page, limit, skip, take, isAll } = resolvePagination({
      page: query.page,
      limit: query.limit,
      all: query.all,
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
    });

    const q = normalizeString(query.q);
    const matchingTypes = q ? resolveMatchingProgramTypes(q) : [];
    const matchingStatuses = q ? resolveMatchingProgramStatuses(q) : [];
    const { from, to } = resolveRangeDates({ from: query.from, to: query.to });

    const where: Prisma.ProgramWhereInput = {
      tenantId,
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { description: { contains: q } },
              { internalNotes: { contains: q } },
              ...matchingTypes.map((type) => ({ type })),
              ...matchingStatuses.map((status) => ({ status })),
            ],
          }
        : {}),
      ...(query.type ? { type: query.type as ProgramType } : {}),
      ...(query.status ? { status: query.status as ProgramStatus } : {}),
      ...(from ? { startsAt: { gte: from } } : {}),
      ...(to ? { endsAt: { lte: to } } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.program.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...(isAll ? {} : { skip, take }),
      }),
      this.prisma.program.count({ where }),
    ]);

    return {
      data,
      pagination: buildPaginationMeta({ page, limit, total, isAll }),
    };
  }

  async getProgram(tenantId: string, id: string) {
    const program = await this.prisma.program.findFirst({
      where: { id, tenantId },
    });
    if (!program) throw new NotFoundException('Programa não encontrado');
    return program;
  }

  async createProgram(tenantId: string, dto: CreateProgramDto) {
    const name = (dto.name ?? '').trim();
    if (!name) throw new BadRequestException('Nome é obrigatório');

    const startsAt = parseDateInput(dto.startsAt);
    const endsAt = parseDateInput(dto.endsAt);
    ensureValidPeriod({ startsAt, endsAt });

    return this.prisma.program.create({
      data: {
        tenantId,
        name,
        type: dto.type,
        description: dto.description?.trim() ? dto.description.trim() : null,
        internalNotes: dto.internalNotes?.trim() ? dto.internalNotes.trim() : null,
        status: dto.status ?? 'PLANNED',
        startsAt,
        endsAt,
      },
    });
  }

  async updateProgram(tenantId: string, id: string, dto: UpdateProgramDto) {
    const existing = await this.prisma.program.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Programa não encontrado');

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

    return this.prisma.program.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() ? dto.description.trim() : null }
          : {}),
        ...(dto.internalNotes !== undefined
          ? { internalNotes: dto.internalNotes?.trim() ? dto.internalNotes.trim() : null }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.startsAt !== undefined ? { startsAt } : {}),
        ...(dto.endsAt !== undefined ? { endsAt } : {}),
      },
    });
  }

  async deleteProgram(tenantId: string, id: string) {
    const existing = await this.prisma.program.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Programa não encontrado');

    const projectsCount = await this.prisma.project.count({
      where: { tenantId, programId: existing.id },
    });
    if (projectsCount > 0) {
      throw new BadRequestException(
        'Não é possível excluir o programa: existem projetos vinculados',
      );
    }

    await this.prisma.program.delete({ where: { id: existing.id } });
    return { ok: true as const };
  }
}
