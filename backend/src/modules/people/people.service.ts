import { Injectable, NotFoundException } from '@nestjs/common';
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

const buildCreateData = (
  tenantId: string,
  dto: CreatePersonDto,
): Prisma.PersonUncheckedCreateInput => ({
  tenantId,
  fullName: dto.fullName.trim(),
  socialName: normalizeString(dto.socialName),
  birthDate: dto.birthDate ?? null,
  gender: normalizeString(dto.gender),
  maritalStatus: normalizeString(dto.maritalStatus),
  nationality: normalizeString(dto.nationality),
  email: normalizeString(dto.email),
  phone: normalizeString(dto.phone),
  document: normalizeString(dto.document),
  rg: normalizeString(dto.rg),
  nis: normalizeString(dto.nis),
  status: normalizeString(dto.status),
  notes: normalizeString(dto.notes),
  profileSummary: normalizeString(dto.profileSummary),
  avatarUrl: normalizeString(dto.avatarUrl),
});

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
  if (dto.gender !== undefined) {
    data.gender = normalizeString(dto.gender);
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
  if (dto.notes !== undefined) {
    data.notes = normalizeString(dto.notes);
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
    return this.prisma.person.create({
      data: buildCreateData(tenantId, dto),
    });
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
      data,
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

    return person;
  }

  async update(tenantId: string, id: string, dto: UpdatePersonDto) {
    await this.findById(tenantId, id);

    return this.prisma.person.update({
      where: { id },
      data: buildUpdateData(dto),
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    await this.prisma.person.delete({ where: { id } });
    return { deleted: true };
  }
}
