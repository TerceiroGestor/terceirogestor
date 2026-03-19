import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../core/prisma/prisma.service';
import { buildPaginationMeta, resolvePagination } from '../../core/utils/pagination';
import { normalizeString } from '../../core/utils/strings';
import { CreateCycleDto } from './dto/create-cycle.dto';
import { ListCyclesQueryDto } from './dto/list-cycles-query.dto';
import { UpdateCycleDto } from './dto/update-cycle.dto';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

const CYCLE_AUDIENCE_SEARCH_MAP: Array<{ value: string; tokens: string[] }> = [
  { value: 'CHILDREN', tokens: ['children', 'criancas', 'crianca', 'infancia', 'infantil'] },
  { value: 'TEENS', tokens: ['teens', 'teen', 'adolescentes', 'adolescente'] },
  { value: 'ADULTS', tokens: ['adults', 'adultos', 'adulto'] },
  { value: 'FAMILIES', tokens: ['families', 'family', 'familiares', 'familia'] },
  { value: 'OTHER', tokens: ['other', 'outro', 'outros'] },
];

function ensureValidAgeRange(params: { ageMin?: number | null; ageMax?: number | null }) {
  const ageMin = params.ageMin ?? null;
  const ageMax = params.ageMax ?? null;
  if (ageMin !== null && ageMax !== null && ageMin > ageMax) {
    throw new BadRequestException('Faixa etaria invalida: minima maior que maxima');
  }
}

function resolveMatchingAudienceTypes(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return CYCLE_AUDIENCE_SEARCH_MAP.filter((entry) =>
    entry.tokens.some((token) => token.includes(normalized) || normalized.includes(token)),
  ).map((entry) => entry.value);
}

@Injectable()
export class CyclesService {
  constructor(private readonly prisma: PrismaService) {}

  async listCycles(tenantId: string, query: ListCyclesQueryDto) {
    const { page, limit, skip, take, isAll } = resolvePagination({
      page: query.page,
      limit: query.limit,
      all: query.all,
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
    });

    const q = normalizeString(query.q);
    const matchingAudienceTypes = q ? resolveMatchingAudienceTypes(q) : [];
    const numericQ = q && /^\d+$/.test(q) ? Number(q) : null;

    const where: Prisma.CycleWhereInput = {
      tenantId,
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { description: { contains: q } },
              { internalNotes: { contains: q } },
              { audienceType: { contains: q } },
              ...matchingAudienceTypes.map((audienceType) => ({ audienceType })),
              ...(numericQ === null ? [] : [{ ageMin: numericQ }, { ageMax: numericQ }]),
            ],
          }
        : {}),
      ...(query.audienceType ? { audienceType: query.audienceType.trim() } : {}),
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      ...(query.ageMin !== undefined ? { OR: [{ ageMin: null }, { ageMin: { gte: query.ageMin } }] } : {}),
      ...(query.ageMax !== undefined ? { OR: [{ ageMax: null }, { ageMax: { lte: query.ageMax } }] } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.cycle.findMany({
        where,
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        ...(isAll ? {} : { skip, take }),
      }),
      this.prisma.cycle.count({ where }),
    ]);

    return {
      data,
      pagination: buildPaginationMeta({ page, limit, total, isAll }),
    };
  }

  async getCycle(tenantId: string, id: string) {
    const cycle = await this.prisma.cycle.findFirst({
      where: { id, tenantId },
    });
    if (!cycle) throw new NotFoundException('Ciclo nao encontrado');
    return cycle;
  }

  async createCycle(tenantId: string, dto: CreateCycleDto) {
    const name = (dto.name ?? '').trim();
    if (!name) throw new BadRequestException('Nome e obrigatorio');

    ensureValidAgeRange({ ageMin: dto.ageMin, ageMax: dto.ageMax });

    return this.prisma.cycle.create({
      data: {
        tenantId,
        name,
        description: dto.description?.trim() ? dto.description.trim() : null,
        audienceType: dto.audienceType?.trim() ? dto.audienceType.trim() : null,
        ageMin: dto.ageMin ?? null,
        ageMax: dto.ageMax ?? null,
        isActive: dto.isActive ?? true,
        internalNotes: dto.internalNotes?.trim() ? dto.internalNotes.trim() : null,
      },
    });
  }

  async updateCycle(tenantId: string, id: string, dto: UpdateCycleDto) {
    const existing = await this.prisma.cycle.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Ciclo nao encontrado');

    const name = dto.name !== undefined ? (dto.name ?? '').trim() : undefined;
    if (name !== undefined && !name) {
      throw new BadRequestException('Nome e obrigatorio');
    }

    const ageMin = dto.ageMin !== undefined ? dto.ageMin : existing.ageMin;
    const ageMax = dto.ageMax !== undefined ? dto.ageMax : existing.ageMax;
    ensureValidAgeRange({ ageMin, ageMax });

    return this.prisma.cycle.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() ? dto.description.trim() : null }
          : {}),
        ...(dto.audienceType !== undefined
          ? { audienceType: dto.audienceType?.trim() ? dto.audienceType.trim() : null }
          : {}),
        ...(dto.ageMin !== undefined ? { ageMin: dto.ageMin ?? null } : {}),
        ...(dto.ageMax !== undefined ? { ageMax: dto.ageMax ?? null } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.internalNotes !== undefined
          ? { internalNotes: dto.internalNotes?.trim() ? dto.internalNotes.trim() : null }
          : {}),
      },
    });
  }

  async deleteCycle(tenantId: string, id: string) {
    const existing = await this.prisma.cycle.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Ciclo nao encontrado');

    const usageCount = await this.prisma.projectCycle.count({
      where: { tenantId, catalogCycleId: existing.id },
    });
    if (usageCount > 0) {
      throw new BadRequestException(
        'Nao e possivel excluir o ciclo: existem projetos vinculados a este catalogo',
      );
    }

    await this.prisma.cycle.delete({ where: { id: existing.id } });
    return { ok: true as const };
  }
}
