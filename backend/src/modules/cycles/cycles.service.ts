import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../core/prisma/prisma.service';
import { buildPaginationMeta, resolvePagination } from '../../core/utils/pagination';
import { normalizeString } from '../../core/utils/strings';
import { CreateCycleAttachmentDto } from './dto/create-cycle-attachment.dto';
import { CreateCycleCommentDto } from './dto/create-cycle-comment.dto';
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

function normalizeTags(tags?: string[] | null) {
  if (!tags) return null;
  const cleaned = Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
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
  return Array.from(new Set(value.map((entry) => String(entry ?? '').trim()).filter(Boolean)));
}

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

const mapCommentAuthor = (
  user:
    | {
        id: string;
        name: string | null;
        email: string | null;
        avatarUrl: string | null;
      }
    | null
    | undefined,
) => ({
  id: user?.id ?? null,
  name: user?.name?.trim() || user?.email || 'Equipe interna',
  email: user?.email ?? null,
  avatarUrl: user?.avatarUrl ?? null,
});

const mapCycleCommentItem = (
  comment: {
    id: string;
    body: string;
    mentionUserIds: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
    authorUser?: {
      id: string;
      name: string | null;
      email: string | null;
      avatarUrl: string | null;
    } | null;
  },
) => ({
  id: comment.id,
  body: comment.body,
  mentionUserIds: parseMentionUserIds(comment.mentionUserIds),
  author: mapCommentAuthor(comment.authorUser),
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

const mapCycleAttachmentItem = (
  attachment: {
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
      avatarUrl: string | null;
    } | null;
  },
) => ({
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

function serializeCycle(cycle: {
  tags: string | null;
  comments?: Array<{
    id: string;
    body: string;
    mentionUserIds: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
    authorUser?: {
      id: string;
      name: string | null;
      email: string | null;
      avatarUrl: string | null;
    } | null;
  }>;
  attachments?: Array<{
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
      avatarUrl: string | null;
    } | null;
  }>;
}) {
  return {
    ...cycle,
    tags: parseTags(cycle.tags),
    comments: cycle.comments?.map(mapCycleCommentItem) ?? [],
    attachments: cycle.attachments?.map(mapCycleAttachmentItem) ?? [],
  };
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
              { tags: { contains: q } },
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
      data: data.map((cycle) => serializeCycle(cycle)),
      pagination: buildPaginationMeta({ page, limit, total, isAll }),
    };
  }

  async getCycle(tenantId: string, id: string) {
    return this.findById(tenantId, id);
  }

  private async findById(tenantId: string, id: string) {
    const cycle = await this.prisma.cycle.findFirst({
      where: { id, tenantId },
      include: {
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
    if (!cycle) throw new NotFoundException('Ciclo nao encontrado');
    return serializeCycle(cycle);
  }

  private async findCycleEntity(tenantId: string, id: string) {
    const cycle = await this.prisma.cycle.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!cycle) throw new NotFoundException('Ciclo nao encontrado');
    return cycle;
  }

  async createCycle(tenantId: string, dto: CreateCycleDto) {
    const name = (dto.name ?? '').trim();
    if (!name) throw new BadRequestException('Nome e obrigatorio');

    ensureValidAgeRange({ ageMin: dto.ageMin, ageMax: dto.ageMax });

    const created = await this.prisma.cycle.create({
      data: {
        tenantId,
        name,
        description: dto.description?.trim() ? dto.description.trim() : null,
        audienceType: dto.audienceType?.trim() ? dto.audienceType.trim() : null,
        ageMin: dto.ageMin ?? null,
        ageMax: dto.ageMax ?? null,
        isActive: dto.isActive ?? true,
        tags: normalizeTags(dto.tags),
        internalNotes: dto.internalNotes?.trim() ? dto.internalNotes.trim() : null,
      },
    });

    return this.findById(tenantId, created.id);
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

    await this.prisma.cycle.update({
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
        ...(dto.tags !== undefined ? { tags: normalizeTags(dto.tags) } : {}),
        ...(dto.internalNotes !== undefined
          ? { internalNotes: dto.internalNotes?.trim() ? dto.internalNotes.trim() : null }
          : {}),
      },
    });

    return this.findById(tenantId, existing.id);
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

  async addComment(
    tenantId: string,
    actorUserId: string,
    cycleId: string,
    dto: CreateCycleCommentDto,
  ) {
    await this.findCycleEntity(tenantId, cycleId);
    const body = dto.body.trim();
    if (!body) {
      throw new BadRequestException('Informe um comentario.');
    }

    const mentionUserIds = await this.resolveMentionUserIds(tenantId, dto.mentionUserIds);

    await this.prisma.cycleComment.create({
      data: {
        tenantId,
        cycleId,
        authorUserId: actorUserId,
        body,
        mentionUserIds,
      },
    });

    return this.findById(tenantId, cycleId);
  }

  async deleteComment(tenantId: string, cycleId: string, commentId: string) {
    await this.findCycleEntity(tenantId, cycleId);
    const comment = await this.prisma.cycleComment.findFirst({
      where: { id: commentId, tenantId, cycleId },
      select: { id: true },
    });
    if (!comment) {
      throw new NotFoundException('Comentario nao encontrado');
    }

    await this.prisma.cycleComment.delete({ where: { id: comment.id } });
    return this.findById(tenantId, cycleId);
  }

  async addAttachment(
    tenantId: string,
    actorUserId: string,
    cycleId: string,
    dto: CreateCycleAttachmentDto,
  ) {
    await this.findCycleEntity(tenantId, cycleId);
    const label = dto.label.trim();
    const filePath = dto.filePath.trim();

    if (!label) {
      throw new BadRequestException('Informe um nome para o anexo.');
    }

    if (!filePath.startsWith('/uploads/cycles/')) {
      throw new BadRequestException('Caminho de anexo invalido.');
    }

    await this.prisma.cycleAttachment.create({
      data: {
        tenantId,
        cycleId,
        uploadedByUserId: actorUserId,
        label,
        filePath,
        mimeType: normalizeString(dto.mimeType),
        fileSizeBytes: dto.fileSizeBytes ?? null,
      },
    });

    return this.findById(tenantId, cycleId);
  }

  async deleteAttachment(tenantId: string, cycleId: string, attachmentId: string) {
    await this.findCycleEntity(tenantId, cycleId);
    const attachment = await this.prisma.cycleAttachment.findFirst({
      where: { id: attachmentId, tenantId, cycleId },
      select: { id: true },
    });
    if (!attachment) {
      throw new NotFoundException('Anexo nao encontrado');
    }

    await this.prisma.cycleAttachment.delete({ where: { id: attachment.id } });
    return this.findById(tenantId, cycleId);
  }

  private async resolveMentionUserIds(tenantId: string, mentionUserIds?: string[] | null) {
    const normalized = Array.from(
      new Set((mentionUserIds ?? []).map((entry) => entry.trim()).filter(Boolean)),
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
