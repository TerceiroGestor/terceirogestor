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
import { normalizeString } from '../../core/utils/strings';
import { CreateReferralAttachmentDto } from './dto/create-referral-attachment.dto';
import { CreateReferralDto } from './dto/create-referral.dto';
import { ListReferralsQueryDto } from './dto/list-referrals-query.dto';
import { UpdateReferralDto } from './dto/update-referral.dto';
import {
  assertOutcomeNotesRequiredForClosing,
  assertReferralStatusTransition,
} from './referral-status';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MILLISECONDS_PER_DAY = 86_400_000;

const referralInclude = {
  attendance: {
    select: { id: true, type: true, scheduledDate: true },
  },
  evolution: {
    select: { id: true, date: true, notes: true },
  },
  destination: {
    select: { id: true, name: true },
  },
  attachments: {
    include: {
      uploadedByUser: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' as const },
  },
} satisfies Prisma.ReferralInclude;

export function buildReferralWhere({
  tenantId,
  query,
}: {
  tenantId: string;
  query: ListReferralsQueryDto;
}): Prisma.ReferralWhereInput {
  const where: Prisma.ReferralWhereInput = { tenantId };

  if (query.status) {
    where.status = query.status;
  }
  if (query.type) {
    where.type = query.type;
  }
  if (query.attendanceId) {
    where.attendanceId = query.attendanceId;
  }
  if (query.evolutionId) {
    where.evolutionId = query.evolutionId;
  }
  if (query.destinationId) {
    where.destinationId = query.destinationId;
  }
  const search = normalizeString(query.q);
  if (search) {
    where.destination = { name: { contains: search, mode: 'insensitive' } };
  }

  return where;
}

@Injectable()
export class ReferralsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: JwtUser, query: ListReferralsQueryDto) {
    const { page, limit, skip, take, isAll } = resolvePagination({
      page: query.page,
      limit: query.limit,
      all: query.all,
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
    });

    const where = buildReferralWhere({ tenantId: user.tenantId, query });

    const [data, total] = await Promise.all([
      this.prisma.referral.findMany({
        where,
        include: referralInclude,
        orderBy: { createdAt: 'desc' },
        ...(isAll ? {} : { skip, take }),
      }),
      this.prisma.referral.count({ where }),
    ]);

    return {
      data,
      pagination: buildPaginationMeta({ page, limit, total, isAll }),
    };
  }

  async getDashboard(user: JwtUser) {
    const tenantId = user.tenantId;
    const [openCount, closedRows] = await Promise.all([
      this.prisma.referral.count({
        where: { tenantId, status: { not: 'ENCERRADO' } },
      }),
      this.prisma.referral.findMany({
        where: { tenantId, status: 'ENCERRADO', closedAt: { not: null } },
        select: { createdAt: true, closedAt: true },
      }),
    ]);

    const averageClosingDays = closedRows.length
      ? closedRows.reduce(
          (acc, row) =>
            acc +
            (row.closedAt!.getTime() - row.createdAt.getTime()) /
              MILLISECONDS_PER_DAY,
          0,
        ) / closedRows.length
      : null;

    return { openCount, averageClosingDays };
  }

  async get(user: JwtUser, referralId: string) {
    return this.ensureReferralExists(user.tenantId, referralId);
  }

  async create(user: JwtUser, dto: CreateReferralDto) {
    const evolution = await this.ensureEvolutionExists(
      user.tenantId,
      dto.evolutionId,
    );
    await this.ensureDestinationExists(user.tenantId, dto.destinationId);

    const status = dto.status ?? 'ABERTO';
    assertOutcomeNotesRequiredForClosing(status, dto.outcomeNotes);

    const created = await this.prisma.referral.create({
      data: {
        tenantId: user.tenantId,
        evolutionId: dto.evolutionId,
        attendanceId: evolution.attendanceId,
        destinationId: dto.destinationId,
        type: dto.type,
        status,
        outcomeNotes: dto.outcomeNotes?.trim() ? dto.outcomeNotes.trim() : null,
        closedAt: status === 'ENCERRADO' ? new Date() : null,
      },
    });

    return this.get(user, created.id);
  }

  async update(user: JwtUser, referralId: string, dto: UpdateReferralDto) {
    const existing = await this.ensureReferralExists(user.tenantId, referralId);

    if (dto.destinationId) {
      await this.ensureDestinationExists(user.tenantId, dto.destinationId);
    }

    const nextStatus = dto.status ?? existing.status;
    if (dto.status) {
      assertReferralStatusTransition(existing.status, dto.status);
    }
    const nextOutcomeNotes =
      dto.outcomeNotes !== undefined ? dto.outcomeNotes : existing.outcomeNotes;
    assertOutcomeNotesRequiredForClosing(nextStatus, nextOutcomeNotes);

    const closingNow = nextStatus === 'ENCERRADO' && !existing.closedAt;

    await this.prisma.referral.update({
      where: { id: referralId },
      data: {
        type: dto.type ?? undefined,
        destinationId: dto.destinationId ?? undefined,
        status: dto.status,
        outcomeNotes:
          dto.outcomeNotes !== undefined
            ? dto.outcomeNotes?.trim()
              ? dto.outcomeNotes.trim()
              : null
            : undefined,
        closedAt: closingNow ? new Date() : undefined,
      },
    });

    return this.get(user, referralId);
  }

  async delete(user: JwtUser, referralId: string) {
    await this.ensureReferralExists(user.tenantId, referralId);
    await this.prisma.referral.delete({ where: { id: referralId } });
    return { success: true };
  }

  async addAttachment(
    user: JwtUser,
    referralId: string,
    dto: CreateReferralAttachmentDto,
  ) {
    await this.ensureReferralExists(user.tenantId, referralId);
    const label = dto.label.trim();
    const filePath = dto.filePath.trim();

    if (!label) {
      throw new BadRequestException('Informe um nome para o anexo.');
    }

    if (!filePath.startsWith('/uploads/referral-attachments/')) {
      throw new BadRequestException('Caminho de anexo invalido.');
    }

    await this.prisma.referralAttachment.create({
      data: {
        tenantId: user.tenantId,
        referralId,
        uploadedByUserId: user.userId,
        label,
        filePath,
        mimeType: normalizeString(dto.mimeType),
        fileSizeBytes: dto.fileSizeBytes ?? null,
      },
    });

    return this.get(user, referralId);
  }

  async deleteAttachment(
    user: JwtUser,
    referralId: string,
    attachmentId: string,
  ) {
    await this.ensureReferralExists(user.tenantId, referralId);
    const attachment = await this.prisma.referralAttachment.findFirst({
      where: { id: attachmentId, tenantId: user.tenantId, referralId },
      select: { id: true },
    });
    if (!attachment) {
      throw new NotFoundException('Anexo nao encontrado');
    }

    await this.prisma.referralAttachment.delete({
      where: { id: attachment.id },
    });
    return this.get(user, referralId);
  }

  private async ensureReferralExists(tenantId: string, referralId: string) {
    const referral = await this.prisma.referral.findFirst({
      where: { id: referralId, tenantId },
      include: referralInclude,
    });
    if (!referral) {
      throw new NotFoundException('Encaminhamento nao encontrado');
    }
    return referral;
  }

  private async ensureEvolutionExists(tenantId: string, evolutionId: string) {
    const evolution = await this.prisma.attendanceEvolution.findFirst({
      where: { id: evolutionId, tenantId },
      select: { id: true, attendanceId: true },
    });
    if (!evolution) {
      throw new BadRequestException('Evolucao invalida');
    }
    return evolution;
  }

  private async ensureDestinationExists(
    tenantId: string,
    destinationId: string,
  ) {
    const destination = await this.prisma.referralDestination.findFirst({
      where: { id: destinationId, tenantId },
      select: { id: true },
    });
    if (!destination) {
      throw new BadRequestException('Rede de destino invalida');
    }
    return destination;
  }
}
