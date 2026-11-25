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
import { AddAttendancePersonDto } from './dto/add-attendance-person.dto';
import { CreateAttendanceBenefitDto } from './dto/create-attendance-benefit.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { CreateAttendanceEvolutionDto } from './dto/create-attendance-evolution.dto';
import { ListAttendancesQueryDto } from './dto/list-attendances-query.dto';
import { UpdateAttendanceBenefitDto } from './dto/update-attendance-benefit.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { UpdateAttendanceEvolutionDto } from './dto/update-attendance-evolution.dto';
import { assertClosingNotesRequiredForClosing } from './attendance-status';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const attendanceInclude = {
  occurrence: { select: { id: true, title: true } },
  case: { select: { id: true, title: true, status: true } },
  professional: { select: { id: true, fullName: true } },
  people: {
    include: {
      person: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  evolutions: { orderBy: { date: 'desc' as const } },
  benefits: { orderBy: { date: 'desc' as const } },
} satisfies Prisma.AttendanceInclude;

export function buildAttendanceWhere({
  tenantId,
  query,
}: {
  tenantId: string;
  query: ListAttendancesQueryDto;
}): Prisma.AttendanceWhereInput {
  const where: Prisma.AttendanceWhereInput = { tenantId };

  if (query.type) {
    where.type = query.type;
  }
  if (query.status) {
    where.status = query.status;
  }
  if (query.professionalId) {
    where.professionalId = query.professionalId;
  }
  if (query.occurrenceId) {
    where.occurrenceId = query.occurrenceId;
  }
  if (query.caseId) {
    where.caseId = query.caseId;
  }
  const search = query.q?.trim();
  if (search) {
    where.OR = [
      { notes: { contains: search, mode: 'insensitive' } },
      {
        people: {
          some: {
            person: { fullName: { contains: search, mode: 'insensitive' } },
          },
        },
      },
    ];
  }

  return where;
}

@Injectable()
export class AttendancesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: JwtUser, query: ListAttendancesQueryDto) {
    const { page, limit, skip, take, isAll } = resolvePagination({
      page: query.page,
      limit: query.limit,
      all: query.all,
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
    });

    const where = buildAttendanceWhere({ tenantId: user.tenantId, query });

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        include: attendanceInclude,
        orderBy: { scheduledDate: 'desc' },
        ...(isAll ? {} : { skip, take }),
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return {
      data,
      pagination: buildPaginationMeta({ page, limit, total, isAll }),
    };
  }

  async get(user: JwtUser, attendanceId: string) {
    return this.ensureAttendanceExists(user.tenantId, attendanceId);
  }

  async create(user: JwtUser, dto: CreateAttendanceDto) {
    await this.ensurePersonExists(user.tenantId, dto.professionalId);
    if (dto.occurrenceId) {
      await this.ensureOccurrenceExists(user.tenantId, dto.occurrenceId);
    }
    if (dto.caseId) {
      await this.ensureCaseExists(user.tenantId, dto.caseId);
    }

    const status = dto.status ?? 'ABERTO';
    assertClosingNotesRequiredForClosing(status, dto.closingNotes);

    const created = await this.prisma.attendance.create({
      data: {
        tenantId: user.tenantId,
        occurrenceId: dto.occurrenceId ?? null,
        caseId: dto.caseId ?? null,
        type: dto.type,
        scheduledDate: new Date(dto.scheduledDate),
        professionalId: dto.professionalId,
        status,
        notes: dto.notes?.trim() ? dto.notes.trim() : null,
        closingNotes: dto.closingNotes?.trim() ? dto.closingNotes.trim() : null,
      },
    });

    return this.get(user, created.id);
  }

  async update(user: JwtUser, attendanceId: string, dto: UpdateAttendanceDto) {
    const existing = await this.ensureAttendanceExists(
      user.tenantId,
      attendanceId,
    );

    if (dto.professionalId) {
      await this.ensurePersonExists(user.tenantId, dto.professionalId);
    }
    if (dto.occurrenceId !== undefined && dto.occurrenceId !== null) {
      await this.ensureOccurrenceExists(user.tenantId, dto.occurrenceId);
    }
    if (dto.caseId !== undefined && dto.caseId !== null) {
      await this.ensureCaseExists(user.tenantId, dto.caseId);
    }

    const nextStatus = dto.status ?? existing.status;
    const nextClosingNotes =
      dto.closingNotes !== undefined ? dto.closingNotes : existing.closingNotes;
    assertClosingNotesRequiredForClosing(nextStatus, nextClosingNotes);

    await this.prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        occurrenceId:
          dto.occurrenceId !== undefined ? dto.occurrenceId : undefined,
        caseId: dto.caseId !== undefined ? dto.caseId : undefined,
        type: dto.type,
        scheduledDate: dto.scheduledDate
          ? new Date(dto.scheduledDate)
          : undefined,
        professionalId: dto.professionalId,
        status: dto.status,
        notes:
          dto.notes !== undefined
            ? dto.notes?.trim()
              ? dto.notes.trim()
              : null
            : undefined,
        closingNotes:
          dto.closingNotes !== undefined
            ? dto.closingNotes?.trim()
              ? dto.closingNotes.trim()
              : null
            : undefined,
      },
    });

    return this.get(user, attendanceId);
  }

  async delete(user: JwtUser, attendanceId: string) {
    await this.ensureAttendanceExists(user.tenantId, attendanceId);
    await this.prisma.attendance.delete({ where: { id: attendanceId } });
    return { success: true };
  }

  async addPerson(
    user: JwtUser,
    attendanceId: string,
    dto: AddAttendancePersonDto,
  ) {
    await this.ensureAttendanceExists(user.tenantId, attendanceId);
    await this.ensurePersonExists(user.tenantId, dto.personId);

    const role = dto.role ?? 'ATENDIDO_PRINCIPAL';
    const existingLink = await this.prisma.attendancePeople.findFirst({
      where: {
        tenantId: user.tenantId,
        attendanceId,
        personId: dto.personId,
        role,
      },
    });
    if (existingLink) {
      throw new BadRequestException('Pessoa ja vinculada com este papel');
    }

    await this.prisma.attendancePeople.create({
      data: {
        tenantId: user.tenantId,
        attendanceId,
        personId: dto.personId,
        role,
      },
    });

    return this.get(user, attendanceId);
  }

  async removePerson(user: JwtUser, attendanceId: string, linkId: string) {
    await this.ensureAttendanceExists(user.tenantId, attendanceId);
    const link = await this.prisma.attendancePeople.findFirst({
      where: { id: linkId, tenantId: user.tenantId, attendanceId },
    });
    if (!link) throw new NotFoundException('Vinculo nao encontrado');

    await this.prisma.attendancePeople.delete({ where: { id: linkId } });
    return this.get(user, attendanceId);
  }

  async addEvolution(
    user: JwtUser,
    attendanceId: string,
    dto: CreateAttendanceEvolutionDto,
  ) {
    await this.ensureAttendanceExists(user.tenantId, attendanceId);

    const notes = dto.notes.trim();
    if (!notes) {
      throw new BadRequestException('Descreva a evolucao');
    }

    await this.prisma.attendanceEvolution.create({
      data: {
        tenantId: user.tenantId,
        attendanceId,
        date: new Date(dto.date),
        notes,
      },
    });

    return this.get(user, attendanceId);
  }

  async updateEvolution(
    user: JwtUser,
    attendanceId: string,
    evolutionId: string,
    dto: UpdateAttendanceEvolutionDto,
  ) {
    await this.ensureAttendanceExists(user.tenantId, attendanceId);
    const evolution = await this.prisma.attendanceEvolution.findFirst({
      where: { id: evolutionId, tenantId: user.tenantId, attendanceId },
    });
    if (!evolution) throw new NotFoundException('Evolucao nao encontrada');

    await this.prisma.attendanceEvolution.update({
      where: { id: evolutionId },
      data: {
        date: dto.date ? new Date(dto.date) : undefined,
        notes: dto.notes?.trim() ? dto.notes.trim() : undefined,
      },
    });

    return this.get(user, attendanceId);
  }

  async removeEvolution(
    user: JwtUser,
    attendanceId: string,
    evolutionId: string,
  ) {
    await this.ensureAttendanceExists(user.tenantId, attendanceId);
    const evolution = await this.prisma.attendanceEvolution.findFirst({
      where: { id: evolutionId, tenantId: user.tenantId, attendanceId },
    });
    if (!evolution) throw new NotFoundException('Evolucao nao encontrada');

    await this.prisma.attendanceEvolution.delete({
      where: { id: evolutionId },
    });
    return this.get(user, attendanceId);
  }

  async addBenefit(
    user: JwtUser,
    attendanceId: string,
    dto: CreateAttendanceBenefitDto,
  ) {
    await this.ensureAttendanceExists(user.tenantId, attendanceId);
    const evolution = await this.prisma.attendanceEvolution.findFirst({
      where: { id: dto.evolutionId, tenantId: user.tenantId, attendanceId },
      select: { id: true },
    });
    if (!evolution) {
      throw new BadRequestException('Evolucao invalida para este atendimento');
    }

    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Informe o nome do beneficio');
    }

    await this.prisma.attendanceBenefit.create({
      data: {
        tenantId: user.tenantId,
        attendanceId,
        evolutionId: dto.evolutionId,
        name,
        date: new Date(dto.date),
        quantity: dto.quantity ?? null,
        notes: dto.notes?.trim() ? dto.notes.trim() : null,
      },
    });

    return this.get(user, attendanceId);
  }

  async updateBenefit(
    user: JwtUser,
    attendanceId: string,
    benefitId: string,
    dto: UpdateAttendanceBenefitDto,
  ) {
    await this.ensureAttendanceExists(user.tenantId, attendanceId);
    const benefit = await this.prisma.attendanceBenefit.findFirst({
      where: { id: benefitId, tenantId: user.tenantId, attendanceId },
    });
    if (!benefit) throw new NotFoundException('Beneficio nao encontrado');

    await this.prisma.attendanceBenefit.update({
      where: { id: benefitId },
      data: {
        name: dto.name?.trim() ? dto.name.trim() : undefined,
        date: dto.date ? new Date(dto.date) : undefined,
        quantity: dto.quantity !== undefined ? dto.quantity : undefined,
        notes:
          dto.notes !== undefined
            ? dto.notes?.trim()
              ? dto.notes.trim()
              : null
            : undefined,
      },
    });

    return this.get(user, attendanceId);
  }

  async removeBenefit(user: JwtUser, attendanceId: string, benefitId: string) {
    await this.ensureAttendanceExists(user.tenantId, attendanceId);
    const benefit = await this.prisma.attendanceBenefit.findFirst({
      where: { id: benefitId, tenantId: user.tenantId, attendanceId },
    });
    if (!benefit) throw new NotFoundException('Beneficio nao encontrado');

    await this.prisma.attendanceBenefit.delete({ where: { id: benefitId } });
    return this.get(user, attendanceId);
  }

  private async ensureAttendanceExists(tenantId: string, attendanceId: string) {
    const attendance = await this.prisma.attendance.findFirst({
      where: { id: attendanceId, tenantId },
      include: attendanceInclude,
    });
    if (!attendance) {
      throw new NotFoundException('Atendimento nao encontrado');
    }
    return attendance;
  }

  private async ensurePersonExists(tenantId: string, personId: string) {
    const person = await this.prisma.person.findFirst({
      where: { id: personId, tenantId },
      select: { id: true },
    });
    if (!person) {
      throw new BadRequestException('Pessoa invalida');
    }
    return person;
  }

  private async ensureOccurrenceExists(tenantId: string, occurrenceId: string) {
    const occurrence = await this.prisma.occurrence.findFirst({
      where: { id: occurrenceId, tenantId },
      select: { id: true },
    });
    if (!occurrence) {
      throw new BadRequestException('Ocorrencia invalida');
    }
    return occurrence;
  }

  private async ensureCaseExists(tenantId: string, caseId: string) {
    const found = await this.prisma.case.findFirst({
      where: { id: caseId, tenantId },
      select: { id: true },
    });
    if (!found) {
      throw new BadRequestException('Caso invalido');
    }
    return found;
  }
}
