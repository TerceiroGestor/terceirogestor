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
import { AddCasePersonDto } from './dto/add-case-person.dto';
import { CreateCaseDto } from './dto/create-case.dto';
import { ListCasesQueryDto } from './dto/list-cases-query.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { assertClosingNotesRequiredForClosing } from './case-status';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const caseInclude = {
  people: {
    include: { person: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
  occurrences: {
    select: { id: true, title: true, status: true },
    orderBy: { createdAt: 'desc' as const },
  },
  attendances: {
    select: { id: true, type: true, status: true, scheduledDate: true },
    orderBy: { createdAt: 'desc' as const },
  },
} satisfies Prisma.CaseInclude;

export function buildCaseWhere({
  tenantId,
  query,
}: {
  tenantId: string;
  query: ListCasesQueryDto;
}): Prisma.CaseWhereInput {
  const where: Prisma.CaseWhereInput = { tenantId };

  if (query.status) {
    where.status = query.status;
  }
  const search = normalizeString(query.q);
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } },
    ];
  }

  return where;
}

@Injectable()
export class CasesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: JwtUser, query: ListCasesQueryDto) {
    const { page, limit, skip, take, isAll } = resolvePagination({
      page: query.page,
      limit: query.limit,
      all: query.all,
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
    });

    const where = buildCaseWhere({ tenantId: user.tenantId, query });

    const [data, total] = await Promise.all([
      this.prisma.case.findMany({
        where,
        include: caseInclude,
        orderBy: { createdAt: 'desc' },
        ...(isAll ? {} : { skip, take }),
      }),
      this.prisma.case.count({ where }),
    ]);

    return {
      data,
      pagination: buildPaginationMeta({ page, limit, total, isAll }),
    };
  }

  async get(user: JwtUser, caseId: string) {
    return this.ensureCaseExists(user.tenantId, caseId);
  }

  async getReport(user: JwtUser, caseId: string) {
    const found = await this.ensureCaseExists(user.tenantId, caseId);
    const attendanceIds = found.attendances.map((attendance) => attendance.id);

    const [evolutionsCount, referralsCount, benefitsCount] = await Promise.all([
      attendanceIds.length
        ? this.prisma.attendanceEvolution.count({
            where: {
              tenantId: user.tenantId,
              attendanceId: { in: attendanceIds },
            },
          })
        : 0,
      attendanceIds.length
        ? this.prisma.referral.count({
            where: {
              tenantId: user.tenantId,
              attendanceId: { in: attendanceIds },
            },
          })
        : 0,
      attendanceIds.length
        ? this.prisma.attendanceBenefit.count({
            where: {
              tenantId: user.tenantId,
              attendanceId: { in: attendanceIds },
            },
          })
        : 0,
    ]);

    return {
      caseId: found.id,
      title: found.title,
      status: found.status,
      closingNotes: found.closingNotes,
      occurrencesCount: found.occurrences.length,
      attendancesCount: found.attendances.length,
      evolutionsCount,
      referralsCount,
      benefitsCount,
    };
  }

  async create(user: JwtUser, dto: CreateCaseDto) {
    const title = dto.title.trim();
    if (!title) {
      throw new BadRequestException('Titulo do caso e obrigatorio');
    }

    const status = dto.status ?? 'ABERTO';
    assertClosingNotesRequiredForClosing(status, dto.closingNotes);

    const created = await this.prisma.case.create({
      data: {
        tenantId: user.tenantId,
        title,
        summary: dto.summary?.trim() ? dto.summary.trim() : null,
        status,
        closingNotes: dto.closingNotes?.trim() ? dto.closingNotes.trim() : null,
      },
    });

    return this.get(user, created.id);
  }

  async update(user: JwtUser, caseId: string, dto: UpdateCaseDto) {
    const existing = await this.ensureCaseExists(user.tenantId, caseId);

    const nextStatus = dto.status ?? existing.status;
    const nextClosingNotes =
      dto.closingNotes !== undefined ? dto.closingNotes : existing.closingNotes;
    assertClosingNotesRequiredForClosing(nextStatus, nextClosingNotes);

    await this.prisma.case.update({
      where: { id: caseId },
      data: {
        title: dto.title?.trim() ? dto.title.trim() : undefined,
        summary:
          dto.summary !== undefined
            ? dto.summary?.trim()
              ? dto.summary.trim()
              : null
            : undefined,
        status: dto.status,
        closingNotes:
          dto.closingNotes !== undefined
            ? dto.closingNotes?.trim()
              ? dto.closingNotes.trim()
              : null
            : undefined,
      },
    });

    return this.get(user, caseId);
  }

  async delete(user: JwtUser, caseId: string) {
    await this.ensureCaseExists(user.tenantId, caseId);
    await this.prisma.case.delete({ where: { id: caseId } });
    return { success: true };
  }

  async addPerson(user: JwtUser, caseId: string, dto: AddCasePersonDto) {
    await this.ensureCaseExists(user.tenantId, caseId);

    const person = await this.prisma.person.findFirst({
      where: { id: dto.personId, tenantId: user.tenantId },
      select: { id: true },
    });
    if (!person) throw new BadRequestException('Pessoa invalida');

    const existingLink = await this.prisma.casePeople.findFirst({
      where: { tenantId: user.tenantId, caseId, personId: dto.personId },
    });
    if (existingLink) {
      throw new BadRequestException('Pessoa ja vinculada a este caso');
    }

    await this.prisma.casePeople.create({
      data: { tenantId: user.tenantId, caseId, personId: dto.personId },
    });

    return this.get(user, caseId);
  }

  async removePerson(user: JwtUser, caseId: string, linkId: string) {
    await this.ensureCaseExists(user.tenantId, caseId);
    const link = await this.prisma.casePeople.findFirst({
      where: { id: linkId, tenantId: user.tenantId, caseId },
    });
    if (!link) throw new NotFoundException('Vinculo nao encontrado');

    await this.prisma.casePeople.delete({ where: { id: linkId } });
    return this.get(user, caseId);
  }

  private async ensureCaseExists(tenantId: string, caseId: string) {
    const found = await this.prisma.case.findFirst({
      where: { id: caseId, tenantId },
      include: caseInclude,
    });
    if (!found) {
      throw new NotFoundException('Caso nao encontrado');
    }
    return found;
  }
}
