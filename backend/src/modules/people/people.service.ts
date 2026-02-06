import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../core/prisma/prisma.service';
import { buildPaginationMeta, resolvePagination } from '../../core/utils/pagination';
import { normalizeString } from '../../core/utils/strings';
import { CreatePersonDto } from './dto/create-person.dto';
import { ListPeopleQueryDto } from './dto/list-people-query.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import {
  buildPeopleOrderBy,
  buildPeopleWhere,
  parseAdvancedFilters,
  parseGrouping,
} from './people.filters';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 1000;

type PersonRecord = Prisma.PersonGetPayload<{}>;

const normalizeTags = (tags?: string[] | null) => {
  if (!tags) return null;
  const cleaned = tags.map((tag) => tag.trim()).filter(Boolean);
  return cleaned.length ? JSON.stringify(cleaned) : null;
};

const parseTags = (raw?: string | null) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item)).filter(Boolean);
    }
  } catch {
    // fallback to csv
  }
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
};

const mapPerson = (person: PersonRecord) => ({
  ...person,
  tags: parseTags(person.tags),
});

const buildCreateData = (
  tenantId: string,
  dto: CreatePersonDto,
): Prisma.PersonUncheckedCreateInput => {
  const normalizedStatus = normalizeString(dto.status);
  return ({
  tenantId,
  fullName: dto.fullName.trim(),
  socialName: normalizeString(dto.socialName),
  birthDate: dto.birthDate ?? null,
  sex: normalizeString(dto.sex),
  gender: normalizeString(dto.gender),
  raceColor: normalizeString(dto.raceColor),
  maritalStatus: normalizeString(dto.maritalStatus),
  nationality: normalizeString(dto.nationality),
  email: normalizeString(dto.email),
  phone: normalizeString(dto.phone),
  document: normalizeString(dto.document),
  rg: normalizeString(dto.rg),
  nis: normalizeString(dto.nis),
  status: normalizedStatus,
  departureReason:
    normalizedStatus === 'Desligado'
      ? normalizeString(dto.departureReason)
      : null,
  notes: normalizeString(dto.notes),
  tags: normalizeTags(dto.tags),
  hasHealthIssue: dto.hasHealthIssue ?? false,
  profileSummary: normalizeString(dto.profileSummary),
  avatarUrl: normalizeString(dto.avatarUrl),
});
};

const buildUpdateData = (
  dto: UpdatePersonDto,
): Prisma.PersonUpdateInput => {
  const data: Prisma.PersonUpdateInput = {};

  if (dto.fullName !== undefined) {
    data.fullName = dto.fullName.trim();
  }
  if (dto.socialName !== undefined) {
    data.socialName = normalizeString(dto.socialName);
  }
  if (dto.sex !== undefined) {
    data.sex = normalizeString(dto.sex);
  }
  if (dto.gender !== undefined) {
    data.gender = normalizeString(dto.gender);
  }
  if (dto.raceColor !== undefined) {
    data.raceColor = normalizeString(dto.raceColor);
  }
  if (dto.maritalStatus !== undefined) {
    data.maritalStatus = normalizeString(dto.maritalStatus);
  }
  if (dto.nationality !== undefined) {
    data.nationality = normalizeString(dto.nationality);
  }
  if (dto.email !== undefined) {
    data.email = normalizeString(dto.email);
  }
  if (dto.phone !== undefined) {
    data.phone = normalizeString(dto.phone);
  }
  if (dto.birthDate !== undefined) {
    data.birthDate = dto.birthDate;
  }
  if (dto.document !== undefined) {
    data.document = normalizeString(dto.document);
  }
  if (dto.rg !== undefined) {
    data.rg = normalizeString(dto.rg);
  }
  if (dto.nis !== undefined) {
    data.nis = normalizeString(dto.nis);
  }
  if (dto.status !== undefined) {
    data.status = normalizeString(dto.status);
  }
  if (dto.departureReason !== undefined) {
    data.departureReason = normalizeString(dto.departureReason);
  }
  if (dto.notes !== undefined) {
    data.notes = normalizeString(dto.notes);
  }
  if (dto.tags !== undefined) {
    data.tags = normalizeTags(dto.tags);
  }
  if (dto.hasHealthIssue !== undefined) {
    data.hasHealthIssue = dto.hasHealthIssue ?? false;
  }
  if (dto.profileSummary !== undefined) {
    data.profileSummary = normalizeString(dto.profileSummary);
  }
  if (dto.avatarUrl !== undefined) {
    data.avatarUrl = normalizeString(dto.avatarUrl);
  }

  return data;
};

@Injectable()
export class PeopleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreatePersonDto) {
    if (
      normalizeString(dto.status) === 'Desligado' &&
      !normalizeString(dto.departureReason)
    ) {
      throw new BadRequestException('Informe o motivo do desligamento.');
    }
    const person = await this.prisma.person.create({
      data: buildCreateData(tenantId, dto),
    });
    return mapPerson(person);
  }

  async findAll(tenantId: string, query: ListPeopleQueryDto) {
    const { page, limit, skip, take, isAll } = resolvePagination({
      page: query.page,
      limit: query.limit,
      all: query.all,
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
    });

    const filters = parseAdvancedFilters(query.filters);
    const grouping = parseGrouping(query.groupBy);
    const where = buildPeopleWhere({
      tenantId,
      query: query.q,
      filters,
    });
    const orderBy = buildPeopleOrderBy(grouping);

    const data = await this.prisma.person.findMany({
      where,
      orderBy,
      skip: isAll ? undefined : skip,
      take: isAll ? undefined : take,
    });

    const total = await this.prisma.person.count({ where });

    return {
      data: data.map(mapPerson),
      pagination: buildPaginationMeta({
        page,
        limit,
        total,
        isAll,
      }),
    };
  }

  async findById(tenantId: string, id: string) {
    const person = await this.prisma.person.findFirst({
      where: { id, tenantId },
    });

    if (!person) {
      throw new NotFoundException('Person not found');
    }

    return mapPerson(person);
  }

  async update(tenantId: string, id: string, dto: UpdatePersonDto) {
    await this.findById(tenantId, id);

    const nextStatus = normalizeString(dto.status);
    if (
      nextStatus === 'Desligado' &&
      !normalizeString(dto.departureReason)
    ) {
      throw new BadRequestException('Informe o motivo do desligamento.');
    }

    const data = buildUpdateData(dto);
    if (dto.status !== undefined && nextStatus !== 'Desligado') {
      data.departureReason = null;
    }

    const person = await this.prisma.person.update({
      where: { id },
      data,
    });
    return mapPerson(person);
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    await this.prisma.person.delete({ where: { id } });
    return { deleted: true };
  }
}
