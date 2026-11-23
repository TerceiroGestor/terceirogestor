import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  buildPaginationMeta,
  resolvePagination,
} from '../../core/utils/pagination';
import { normalizeString } from '../../core/utils/strings';
import { CreatePeopleGroupAttachmentDto } from './dto/create-people-group-attachment.dto';
import { CreatePeopleGroupParticipationDto } from './dto/create-people-group-participation.dto';
import { CreatePeopleGroupDto } from './dto/create-people-group.dto';
import { EndPeopleGroupParticipationDto } from './dto/end-people-group-participation.dto';
import { ListPeopleGroupParticipationsQueryDto } from './dto/list-people-group-participations-query.dto';
import { ListPeopleGroupsQueryDto } from './dto/list-people-groups-query.dto';
import { UpdatePeopleGroupDto } from './dto/update-people-group.dto';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

function ensureValidAgeRange(params: {
  ageMin?: number | null;
  ageMax?: number | null;
}) {
  const ageMin = params.ageMin ?? null;
  const ageMax = params.ageMax ?? null;
  if (ageMin !== null && ageMax !== null && ageMin > ageMax) {
    throw new BadRequestException(
      'Faixa etaria invalida: minima maior que maxima',
    );
  }
}

function buildActiveParticipationKey(peopleGroupId: string, personId: string) {
  return `${peopleGroupId}:${personId}`;
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

const mapPeopleGroupAttachmentItem = (attachment: {
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

function serializePeopleGroup<
  T extends {
    tags: string | null;
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
  },
>(group: T) {
  return {
    ...group,
    tags: parseTags(group.tags),
    attachments: group.attachments?.map(mapPeopleGroupAttachmentItem) ?? [],
  };
}

@Injectable()
export class PeopleGroupsService {
  constructor(private readonly prisma: PrismaService) { }

  async listPeopleGroups(tenantId: string, query: ListPeopleGroupsQueryDto) {
    const { page, limit, skip, take, isAll } = resolvePagination({
      page: query.page,
      limit: query.limit,
      all: query.all,
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
    });

    const q = normalizeString(query.q);
    const numericQ = q && /^\d+$/.test(q) ? Number(q) : null;

    const where: Prisma.PeopleGroupWhereInput = {
      tenantId,
      ...(q
        ? {
          OR: [
            { name: { contains: q } },
            { category: { contains: q } },
            { description: { contains: q } },
            { tags: { contains: q } },
            { internalNotes: { contains: q } },
            ...(numericQ === null
              ? []
              : [{ ageMin: numericQ }, { ageMax: numericQ }]),
          ],
        }
        : {}),
      ...(query.groupType ? { groupType: query.groupType } : {}),
      ...(query.purpose ? { purpose: query.purpose } : {}),
      ...(query.category ? { category: query.category.trim() } : {}),
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.peopleGroup.findMany({
        where,
        include: {
          _count: {
            select: {
              participations: {
                where: {
                  isActive: true,
                  deletedAt: null,
                },
              },
            },
          },
        },
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        ...(isAll ? {} : { skip, take }),
      }),
      this.prisma.peopleGroup.count({ where }),
    ]);

    return {
      data: data.map((group) => serializePeopleGroup(group)),
      pagination: buildPaginationMeta({ page, limit, total, isAll }),
    };
  }

  async getPeopleGroup(tenantId: string, id: string) {
    const group = await this.prisma.peopleGroup.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            participations: {
              where: {
                isActive: true,
                deletedAt: null,
              },
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
    if (!group) throw new NotFoundException('Grupos nao encontrado');
    return serializePeopleGroup(group);
  }

  async createPeopleGroup(tenantId: string, dto: CreatePeopleGroupDto) {
    const name = (dto.name ?? '').trim();
    if (!name) throw new BadRequestException('Nome e obrigatorio');
    ensureValidAgeRange(dto);

    const created = await this.prisma.peopleGroup.create({
      data: {
        tenantId,
        name,
        groupType: dto.groupType ?? 'SEGMENT',
        purpose:
          dto.purpose ?? (dto.groupType === 'TEAM_POOL' ? 'EQUIPE' : 'PUBLICO'),
        category: dto.category?.trim() ? dto.category.trim() : null,
        description: dto.description?.trim() ? dto.description.trim() : null,
        tags: normalizeTags(dto.tags),
        ageMin: dto.ageMin ?? null,
        ageMax: dto.ageMax ?? null,
        isActive: dto.isActive ?? true,
        internalNotes: dto.internalNotes?.trim()
          ? dto.internalNotes.trim()
          : null,
      },
      include: {
        _count: {
          select: {
            participations: {
              where: {
                isActive: true,
                deletedAt: null,
              },
            },
          },
        },
      },
    });
    return serializePeopleGroup(created);
  }

  async updatePeopleGroup(
    tenantId: string,
    id: string,
    dto: UpdatePeopleGroupDto,
  ) {
    const existing = await this.prisma.peopleGroup.findFirst({
      where: { id, tenantId },
    });
    if (!existing)
      throw new NotFoundException('Grupos nao encontrado');

    const name = dto.name !== undefined ? (dto.name ?? '').trim() : undefined;
    if (name !== undefined && !name) {
      throw new BadRequestException('Nome e obrigatorio');
    }

    ensureValidAgeRange({
      ageMin: dto.ageMin !== undefined ? dto.ageMin : existing.ageMin,
      ageMax: dto.ageMax !== undefined ? dto.ageMax : existing.ageMax,
    });

    const updated = await this.prisma.peopleGroup.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(dto.groupType !== undefined ? { groupType: dto.groupType } : {}),
        ...(dto.purpose !== undefined ? { purpose: dto.purpose } : {}),
        ...(dto.category !== undefined
          ? { category: dto.category?.trim() ? dto.category.trim() : null }
          : {}),
        ...(dto.description !== undefined
          ? {
            description: dto.description?.trim()
              ? dto.description.trim()
              : null,
          }
          : {}),
        ...(dto.tags !== undefined ? { tags: normalizeTags(dto.tags) } : {}),
        ...(dto.ageMin !== undefined ? { ageMin: dto.ageMin ?? null } : {}),
        ...(dto.ageMax !== undefined ? { ageMax: dto.ageMax ?? null } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.internalNotes !== undefined
          ? {
            internalNotes: dto.internalNotes?.trim()
              ? dto.internalNotes.trim()
              : null,
          }
          : {}),
      },
      include: {
        _count: {
          select: {
            participations: {
              where: {
                isActive: true,
                deletedAt: null,
              },
            },
          },
        },
      },
    });
    return serializePeopleGroup(updated);
  }

  async deletePeopleGroup(tenantId: string, id: string) {
    const existing = await this.prisma.peopleGroup.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing)
      throw new NotFoundException('Grupos nao encontrado');

    const [activeParticipations, projectUses, actionUses] =
      await this.prisma.$transaction([
        this.prisma.peopleGroupParticipation.count({
          where: {
            tenantId,
            peopleGroupId: existing.id,
            isActive: true,
            deletedAt: null,
          },
        }),
        this.prisma.projectPeopleGroup.count({
          where: { tenantId, peopleGroupId: existing.id },
        }),
        this.prisma.activityPeopleGroup.count({
          where: { tenantId, peopleGroupId: existing.id },
        }),
      ]);

    if (activeParticipations > 0 || projectUses > 0 || actionUses > 0) {
      throw new BadRequestException(
        'Nao e possivel excluir o Grupos: existem participacoes ou vinculos ativos',
      );
    }

    await this.prisma.peopleGroup.delete({ where: { id: existing.id } });
    return { ok: true as const };
  }

  async listPeopleGroupParticipations(
    tenantId: string,
    peopleGroupId: string,
    query: ListPeopleGroupParticipationsQueryDto,
  ) {
    await this.assertPeopleGroupExists(tenantId, peopleGroupId);

    const { page, limit, skip, take, isAll } = resolvePagination({
      page: query.page,
      limit: query.limit,
      all: query.all,
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
    });

    const q = normalizeString(query.q);
    const where: Prisma.PeopleGroupParticipationWhereInput = {
      tenantId,
      peopleGroupId,
      ...(query.isActive === undefined
        ? {}
        : query.isActive
          ? { isActive: true, deletedAt: null }
          : { isActive: false }),
      ...(q
        ? {
          OR: [
            { person: { fullName: { contains: q } } },
            { person: { socialName: { contains: q } } },
            { person: { status: { contains: q } } },
            { person: { personType: { contains: q } } },
            { internalNotes: { contains: q } },
          ],
        }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.peopleGroupParticipation.findMany({
        where,
        include: { person: true },
        orderBy: [
          { isActive: 'desc' },
          { startsAt: 'desc' },
          { createdAt: 'desc' },
        ],
        ...(isAll ? {} : { skip, take }),
      }),
      this.prisma.peopleGroupParticipation.count({ where }),
    ]);

    return {
      data,
      pagination: buildPaginationMeta({ page, limit, total, isAll }),
    };
  }

  async createPeopleGroupParticipation(
    tenantId: string,
    peopleGroupId: string,
    dto: CreatePeopleGroupParticipationDto,
  ) {
    await this.assertPeopleGroupExists(tenantId, peopleGroupId);

    const personId = (dto.personId ?? '').trim();
    if (!personId) {
      throw new BadRequestException('personId e obrigatorio');
    }

    const person = await this.prisma.person.findFirst({
      where: { id: personId, tenantId },
      select: { id: true },
    });
    if (!person) throw new NotFoundException('Pessoa nao encontrada');

    const activeKey = buildActiveParticipationKey(peopleGroupId, personId);
    const existingActive = await this.prisma.peopleGroupParticipation.findFirst(
      {
        where: { tenantId, activeKey, isActive: true, deletedAt: null },
        select: { id: true },
      },
    );
    if (existingActive) {
      throw new BadRequestException('A pessoa ja participa deste Grupos');
    }

    return this.prisma.peopleGroupParticipation.create({
      data: {
        tenantId,
        peopleGroupId,
        personId,
        activeKey,
        isActive: true,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
        internalNotes: dto.internalNotes?.trim()
          ? dto.internalNotes.trim()
          : null,
      },
      include: { person: true },
    });
  }

  async endPeopleGroupParticipation(
    tenantId: string,
    peopleGroupId: string,
    participationId: string,
    dto: EndPeopleGroupParticipationDto,
  ) {
    const participation = await this.prisma.peopleGroupParticipation.findFirst({
      where: { id: participationId, tenantId, peopleGroupId },
      include: { person: true },
    });
    if (!participation)
      throw new NotFoundException('Participacao do Grupos nao encontrada');

    if (!participation.isActive || participation.deletedAt) {
      return participation;
    }

    return this.prisma.peopleGroupParticipation.update({
      where: { id: participation.id },
      data: {
        isActive: false,
        activeKey: null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : new Date(),
        deletedAt: new Date(),
        ...(dto.internalNotes !== undefined
          ? {
            internalNotes: dto.internalNotes?.trim()
              ? dto.internalNotes.trim()
              : participation.internalNotes,
          }
          : {}),
      },
      include: { person: true },
    });
  }

  async addAttachment(
    tenantId: string,
    actorUserId: string,
    peopleGroupId: string,
    dto: CreatePeopleGroupAttachmentDto,
  ) {
    await this.assertPeopleGroupExists(tenantId, peopleGroupId);
    const label = dto.label.trim();
    const filePath = dto.filePath.trim();

    if (!label) {
      throw new BadRequestException('Informe um nome para o anexo.');
    }

    if (!filePath.startsWith('/uploads/people-groups/')) {
      throw new BadRequestException('Caminho de anexo invalido.');
    }

    await this.prisma.peopleGroupAttachment.create({
      data: {
        tenantId,
        peopleGroupId,
        uploadedByUserId: actorUserId,
        label,
        filePath,
        mimeType: normalizeString(dto.mimeType),
        fileSizeBytes: dto.fileSizeBytes ?? null,
      },
    });

    return this.getPeopleGroup(tenantId, peopleGroupId);
  }

  async deleteAttachment(
    tenantId: string,
    peopleGroupId: string,
    attachmentId: string,
  ) {
    await this.assertPeopleGroupExists(tenantId, peopleGroupId);
    const attachment = await this.prisma.peopleGroupAttachment.findFirst({
      where: { id: attachmentId, tenantId, peopleGroupId },
      select: { id: true },
    });
    if (!attachment) {
      throw new NotFoundException('Anexo nao encontrado');
    }

    await this.prisma.peopleGroupAttachment.delete({
      where: { id: attachment.id },
    });
    return this.getPeopleGroup(tenantId, peopleGroupId);
  }

  private async assertPeopleGroupExists(
    tenantId: string,
    peopleGroupId: string,
  ) {
    const peopleGroup = await this.prisma.peopleGroup.findFirst({
      where: { id: peopleGroupId, tenantId },
      select: { id: true },
    });
    if (!peopleGroup)
      throw new NotFoundException('Grupos nao encontrado');
    return peopleGroup;
  }
}
