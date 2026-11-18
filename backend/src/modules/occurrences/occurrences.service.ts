import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma';
import type { JwtUser } from '../../core/auth/strategies/jwt.strategy';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  buildPaginationMeta,
  resolvePagination,
} from '../../core/utils/pagination';
import { AddOccurrencePersonDto } from './dto/add-occurrence-person.dto';
import { CreateOccurrenceDto } from './dto/create-occurrence.dto';
import { ListOccurrencesQueryDto } from './dto/list-occurrences-query.dto';
import { UpdateOccurrenceDto } from './dto/update-occurrence.dto';
import {
  assertOccurrenceStatusTransition,
  assertOutcomeNotesRequiredForClosing,
} from './occurrence-status';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const occurrenceInclude = {
  meeting: {
    select: {
      id: true,
      scheduledDate: true,
      action: { select: { id: true, title: true, projectId: true } },
    },
  },
  people: {
    include: {
      person: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.OccurrenceInclude;

export function buildOccurrenceWhere({
  tenantId,
  query,
}: {
  tenantId: string;
  query: ListOccurrencesQueryDto;
}): Prisma.OccurrenceWhereInput {
  const where: Prisma.OccurrenceWhereInput = { tenantId };

  if (query.status) {
    where.status = query.status;
  }
  if (query.meetingId) {
    where.meetingId = query.meetingId;
  }
  const search = query.q?.trim();
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  return where;
}

@Injectable()
export class OccurrencesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: JwtUser, query: ListOccurrencesQueryDto) {
    const { page, limit, skip, take, isAll } = resolvePagination({
      page: query.page,
      limit: query.limit,
      all: query.all,
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
    });

    const where = buildOccurrenceWhere({ tenantId: user.tenantId, query });

    const [data, total] = await Promise.all([
      this.prisma.occurrence.findMany({
        where,
        include: occurrenceInclude,
        orderBy: { createdAt: 'desc' },
        ...(isAll ? {} : { skip, take }),
      }),
      this.prisma.occurrence.count({ where }),
    ]);

    return {
      data,
      pagination: buildPaginationMeta({ page, limit, total, isAll }),
    };
  }

  async get(user: JwtUser, occurrenceId: string) {
    return this.ensureOccurrenceExists(user.tenantId, occurrenceId);
  }

  async create(user: JwtUser, dto: CreateOccurrenceDto) {
    if (dto.meetingId) {
      await this.ensureMeetingExists(user.tenantId, dto.meetingId);
    }

    const title = dto.title.trim();
    if (!title) {
      throw new BadRequestException('Titulo e obrigatorio');
    }

    const status = dto.status ?? 'REGISTRADA';
    assertOutcomeNotesRequiredForClosing(status, dto.outcomeNotes);

    const created = await this.prisma.occurrence.create({
      data: {
        tenantId: user.tenantId,
        meetingId: dto.meetingId ?? null,
        title,
        description: dto.description?.trim() ? dto.description.trim() : null,
        status,
        outcomeNotes: dto.outcomeNotes?.trim() ? dto.outcomeNotes.trim() : null,
      },
    });

    return this.get(user, created.id);
  }

  async update(user: JwtUser, occurrenceId: string, dto: UpdateOccurrenceDto) {
    const existing = await this.ensureOccurrenceExists(
      user.tenantId,
      occurrenceId,
    );

    if (dto.meetingId !== undefined && dto.meetingId !== null) {
      await this.ensureMeetingExists(user.tenantId, dto.meetingId);
    }

    const nextStatus = dto.status ?? existing.status;
    if (dto.status) {
      assertOccurrenceStatusTransition(existing.status, dto.status);
    }
    const nextOutcomeNotes =
      dto.outcomeNotes !== undefined ? dto.outcomeNotes : existing.outcomeNotes;
    assertOutcomeNotesRequiredForClosing(nextStatus, nextOutcomeNotes);

    await this.prisma.occurrence.update({
      where: { id: occurrenceId },
      data: {
        meetingId: dto.meetingId !== undefined ? dto.meetingId : undefined,
        title: dto.title?.trim() ? dto.title.trim() : undefined,
        description:
          dto.description !== undefined
            ? dto.description?.trim()
              ? dto.description.trim()
              : null
            : undefined,
        status: dto.status,
        outcomeNotes:
          dto.outcomeNotes !== undefined
            ? dto.outcomeNotes?.trim()
              ? dto.outcomeNotes.trim()
              : null
            : undefined,
      },
    });

    return this.get(user, occurrenceId);
  }

  async delete(user: JwtUser, occurrenceId: string) {
    await this.ensureOccurrenceExists(user.tenantId, occurrenceId);
    await this.prisma.occurrence.delete({ where: { id: occurrenceId } });
    return { success: true };
  }

  async addPerson(
    user: JwtUser,
    occurrenceId: string,
    dto: AddOccurrencePersonDto,
  ) {
    await this.ensureOccurrenceExists(user.tenantId, occurrenceId);

    const person = await this.prisma.person.findFirst({
      where: { id: dto.personId, tenantId: user.tenantId },
      select: { id: true },
    });
    if (!person) throw new BadRequestException('Pessoa invalida');

    const role = dto.role ?? 'ENVOLVIDO';
    const existingLink = await this.prisma.occurrencePeople.findFirst({
      where: {
        tenantId: user.tenantId,
        occurrenceId,
        personId: dto.personId,
        role,
      },
    });
    if (existingLink) {
      throw new BadRequestException('Pessoa ja vinculada com este papel');
    }

    await this.prisma.occurrencePeople.create({
      data: {
        tenantId: user.tenantId,
        occurrenceId,
        personId: dto.personId,
        role,
      },
    });

    return this.get(user, occurrenceId);
  }

  async removePerson(user: JwtUser, occurrenceId: string, linkId: string) {
    await this.ensureOccurrenceExists(user.tenantId, occurrenceId);
    const link = await this.prisma.occurrencePeople.findFirst({
      where: { id: linkId, tenantId: user.tenantId, occurrenceId },
    });
    if (!link) throw new NotFoundException('Vinculo nao encontrado');

    await this.prisma.occurrencePeople.delete({ where: { id: linkId } });
    return this.get(user, occurrenceId);
  }

  private async ensureOccurrenceExists(tenantId: string, occurrenceId: string) {
    const occurrence = await this.prisma.occurrence.findFirst({
      where: { id: occurrenceId, tenantId },
      include: occurrenceInclude,
    });
    if (!occurrence) {
      throw new NotFoundException('Ocorrencia nao encontrada');
    }
    return occurrence;
  }

  private async ensureMeetingExists(tenantId: string, meetingId: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, tenantId },
      select: { id: true },
    });
    if (!meeting) {
      throw new BadRequestException('Encontro invalido');
    }
    return meeting;
  }
}
