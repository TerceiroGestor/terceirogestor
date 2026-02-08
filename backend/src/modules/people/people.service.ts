import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma';
import { HouseholdTransferType, IncomeFrequency } from '../../../generated/prisma';
import { PrismaService } from '../../core/prisma/prisma.service';
import { buildPaginationMeta, resolvePagination } from '../../core/utils/pagination';
import { normalizeString } from '../../core/utils/strings';
import { CreateHouseholdAssetDto } from './dto/create-household-asset.dto';
import { CreatePersonAssetDto } from './dto/create-person-asset.dto';
import { CreatePersonDto } from './dto/create-person.dto';
import { CreatePersonExpenseDto } from './dto/create-person-expense.dto';
import { CreatePersonIncomeDto } from './dto/create-person-income.dto';
import { CreatePersonRelationDto } from './dto/create-person-relation.dto';
import { CreateHouseholdTransferDto } from './dto/create-household-transfer.dto';
import { ListPeopleQueryDto } from './dto/list-people-query.dto';
import { UpdateHouseholdAssetDto } from './dto/update-household-asset.dto';
import { UpsertHouseholdProfileDto } from './dto/upsert-household-profile.dto';
import { UpdatePersonAssetDto } from './dto/update-person-asset.dto';
import { UpdatePersonExpenseDto } from './dto/update-person-expense.dto';
import { UpdatePersonIncomeDto } from './dto/update-person-income.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { UpdateHouseholdTransferDto } from './dto/update-household-transfer.dto';
import { UpdatePersonRelationDto } from './dto/update-person-relation.dto';
import {
  buildPeopleOrderBy,
  buildPeopleWhere,
  parseAdvancedFilters,
  parseGrouping,
} from './people.filters';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 1000;

type PersonRecord = Prisma.PersonGetPayload<{}>;
type PersonSummary = Prisma.PersonGetPayload<{
  select: {
    id: true;
    fullName: true;
    avatarUrl: true;
    birthDate: true;
    sex: true;
    gender: true;
    raceColor: true;
    status: true;
  };
}>;
type HouseholdMemberRecord = Prisma.HouseholdMemberGetPayload<{
  include: { person: true };
}>;
type PersonRelationRecord = Prisma.PersonRelationGetPayload<{
  include: { relatedPerson: true };
}>;
type PersonIncomeRecord = Prisma.PersonIncomeGetPayload<{}>;
type PersonExpenseRecord = Prisma.PersonExpenseGetPayload<{}>;
type HouseholdProfileRecord = Prisma.HouseholdProfileGetPayload<{}>;
type HouseholdAssetRecord = Prisma.HouseholdAssetGetPayload<{}>;
type PersonAssetRecord = Prisma.PersonAssetGetPayload<{}>;
type HouseholdTransferRecord = Prisma.HouseholdTransferGetPayload<{}>;

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

const mapPersonSummary = (person: PersonSummary) => ({
  id: person.id,
  fullName: person.fullName,
  avatarUrl: person.avatarUrl,
  birthDate: person.birthDate,
  sex: person.sex,
  gender: person.gender,
  raceColor: person.raceColor,
  status: person.status,
});

const mapPersonSummaryFromRecord = (person: PersonRecord) => ({
  id: person.id,
  fullName: person.fullName,
  avatarUrl: person.avatarUrl,
  birthDate: person.birthDate,
  sex: person.sex,
  gender: person.gender,
  raceColor: person.raceColor,
  status: person.status,
});

const mapIncome = (income: PersonIncomeRecord) => ({
  id: income.id,
  personId: income.personId,
  householdId: income.householdId ?? null,
  type: income.type,
  amount: Number(income.amount),
  frequency: income.frequency,
  contractType: income.contractType,
  isHouseholdContribution: income.isHouseholdContribution,
  notes: income.notes,
  createdAt: income.createdAt,
  updatedAt: income.updatedAt,
});

const mapExpense = (expense: PersonExpenseRecord) => ({
  id: expense.id,
  personId: expense.personId,
  householdId: expense.householdId ?? null,
  type: expense.type,
  amount: Number(expense.amount),
  frequency: expense.frequency,
  isHouseholdExpense: expense.isHouseholdExpense,
  notes: expense.notes,
  createdAt: expense.createdAt,
  updatedAt: expense.updatedAt,
});

const mapTransfer = (transfer: HouseholdTransferRecord) => ({
  id: transfer.id,
  personId: transfer.personId,
  fromHouseholdId: transfer.fromHouseholdId,
  toHouseholdId: transfer.toHouseholdId,
  type: transfer.type,
  amount: Number(transfer.amount),
  frequency: transfer.frequency,
  notes: transfer.notes,
  createdAt: transfer.createdAt,
  updatedAt: transfer.updatedAt,
});

const mapHouseholdProfile = (profile: HouseholdProfileRecord) => ({
  id: profile.id,
  householdId: profile.householdId,
  type: profile.type,
  condition: profile.condition,
  ownership: profile.ownership,
  areaM2: profile.areaM2,
  rooms: profile.rooms,
  bathrooms: profile.bathrooms,
  notes: profile.notes,
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt,
});

const mapHouseholdAsset = (asset: HouseholdAssetRecord) => ({
  id: asset.id,
  householdId: asset.householdId,
  category: asset.category,
  item: asset.item,
  quantity: asset.quantity,
  condition: asset.condition,
  notes: asset.notes,
  createdAt: asset.createdAt,
  updatedAt: asset.updatedAt,
});

const mapPersonAsset = (asset: PersonAssetRecord) => ({
  id: asset.id,
  personId: asset.personId,
  category: asset.category,
  item: asset.item,
  quantity: asset.quantity,
  condition: asset.condition,
  notes: asset.notes,
  createdAt: asset.createdAt,
  updatedAt: asset.updatedAt,
});

const normalizeRelationKey = (value?: string | null) =>
  (value ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

const resolveParentTypeFromPerson = (
  person?: { sex?: string | null; gender?: string | null } | null,
) => {
  const sexKey = normalizeRelationKey(person?.sex);
  const genderKey = normalizeRelationKey(person?.gender);
  if (sexKey.startsWith('f') || genderKey.includes('mulher')) {
    return 'Mae';
  }
  if (sexKey.startsWith('m') || genderKey.includes('homem')) {
    return 'Pai';
  }
  return 'Responsavel';
};

const resolveInverseType = async (
  tx: Prisma.TransactionClient,
  relation: Prisma.PersonRelationUncheckedCreateInput & {
    relatedPersonId: string;
    personId: string;
    type: string;
  },
) => {
  const key = normalizeRelationKey(relation.type);
  if (key.startsWith('pai') || key.startsWith('mae') || key === 'paimae') {
    return 'Filho(a)';
  }
  if (key.startsWith('filho') || key.startsWith('filha')) {
    const person = await tx.person.findUnique({
      where: { id: relation.personId },
      select: { sex: true, gender: true },
    });
    return resolveParentTypeFromPerson(person);
  }
  if (key.startsWith('irma')) {
    return 'Irmao(a)';
  }
  if (key.startsWith('conjuge')) {
    return 'Conjuge';
  }
  if (key.startsWith('responsavel')) {
    return 'Dependente';
  }
  if (key.startsWith('dependente')) {
    return 'Responsavel';
  }
  if (key.startsWith('tio')) {
    return 'Sobrinho(a)';
  }
  if (key.startsWith('sobrinho') || key.startsWith('sobrinha')) {
    return 'Tio(a)';
  }
  if (key.startsWith('primo') || key.startsWith('prima')) {
    return 'Primo(a)';
  }
  if (key.startsWith('avo')) {
    return 'Neto(a)';
  }
  if (key.startsWith('neto') || key.startsWith('neta')) {
    return 'Avo(a)';
  }
  return relation.type;
};

const normalizeCategory = (value?: string | null) =>
  (value ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const resolveIncomeFrequency = (value?: string | null): IncomeFrequency => {
  const fallback = "MONTHLY" as IncomeFrequency;
  if (!value) return fallback;
  const normalized = value.toString().toUpperCase();
  const enumValues = (IncomeFrequency ??
    ({
      MONTHLY: "MONTHLY",
      WEEKLY: "WEEKLY",
      BIWEEKLY: "BIWEEKLY",
      ANNUAL: "ANNUAL",
      ONCE: "ONCE",
    } as const)) as Record<string, string>;
  const values = Object.values(enumValues) as IncomeFrequency[];
  const match = values.find((item) => item === normalized);
  return match ?? fallback;
};

const resolveTransferType = (
  value?: string | null,
): HouseholdTransferType => {
  const fallback = 'PENSION' as HouseholdTransferType;
  if (!value) return fallback;
  const normalized = value.toString().toUpperCase();
  const enumValues = (HouseholdTransferType ??
    ({
      PENSION: 'PENSION',
      TRANSFER: 'TRANSFER',
    } as const)) as Record<string, string>;
  const values = Object.values(enumValues) as HouseholdTransferType[];
  const match = values.find((item) => item === normalized);
  return match ?? fallback;
};

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

  async listIncomes(tenantId: string, personId: string) {
    await this.findById(tenantId, personId);
    const incomes = await this.prisma.personIncome.findMany({
      where: { tenantId, personId },
      orderBy: { createdAt: 'desc' },
    });
    return incomes.map(mapIncome);
  }

  private async resolveHouseholdId(
    tenantId: string,
    personId: string,
    householdId?: string | null,
  ) {
    if (householdId === null) return null;
    if (householdId) {
      const household = await this.prisma.household.findFirst({
        where: { id: householdId, tenantId },
      });
      if (!household) {
        throw new BadRequestException('Residencia nao encontrada.');
      }
      return householdId;
    }

    const currentMember = await this.prisma.householdMember.findFirst({
      where: { tenantId, personId, endDate: null },
      orderBy: { startDate: 'desc' },
    });
    if (currentMember) {
      return currentMember.householdId;
    }

    const anyMember = await this.prisma.householdMember.findFirst({
      where: { tenantId, personId },
      orderBy: { startDate: 'desc' },
    });
    return anyMember?.householdId ?? null;
  }

  async listExpenses(tenantId: string, personId: string) {
    await this.findById(tenantId, personId);
    const expenses = await this.prisma.personExpense.findMany({
      where: { tenantId, personId },
      orderBy: { createdAt: 'desc' },
    });
    return expenses.map(mapExpense);
  }

  async createIncome(
    tenantId: string,
    personId: string,
    dto: CreatePersonIncomeDto,
  ) {
    await this.findById(tenantId, personId);
    const householdId = await this.resolveHouseholdId(
      tenantId,
      personId,
      dto.householdId,
    );
    const income = await this.prisma.personIncome.create({
      data: {
        tenantId,
        personId,
        householdId,
        type: normalizeString(dto.type) ?? 'Outro',
        amount: dto.amount,
        frequency: resolveIncomeFrequency(dto.frequency),
        contractType: normalizeString(dto.contractType),
        isHouseholdContribution: dto.isHouseholdContribution ?? true,
        notes: normalizeString(dto.notes),
      },
    });
    return mapIncome(income);
  }

  async updateIncome(
    tenantId: string,
    personId: string,
    incomeId: string,
    dto: UpdatePersonIncomeDto,
  ) {
    const income = await this.prisma.personIncome.findFirst({
      where: { id: incomeId, tenantId, personId },
    });
    if (!income) {
      throw new NotFoundException('Renda nao encontrada.');
    }

    const updated = await this.prisma.personIncome.update({
      where: { id: incomeId },
      data: {
        householdId:
          dto.householdId !== undefined
            ? await this.resolveHouseholdId(tenantId, personId, dto.householdId)
            : undefined,
        type:
          dto.type !== undefined
            ? normalizeString(dto.type) ?? undefined
            : undefined,
        amount: dto.amount !== undefined ? dto.amount : undefined,
        frequency:
          dto.frequency !== undefined
            ? resolveIncomeFrequency(dto.frequency)
            : undefined,
        contractType:
          dto.contractType !== undefined
            ? normalizeString(dto.contractType)
            : undefined,
        isHouseholdContribution:
          dto.isHouseholdContribution !== undefined
            ? dto.isHouseholdContribution
            : undefined,
        notes: dto.notes !== undefined ? normalizeString(dto.notes) : undefined,
      },
    });

    return mapIncome(updated);
  }

  async createExpense(
    tenantId: string,
    personId: string,
    dto: CreatePersonExpenseDto,
  ) {
    await this.findById(tenantId, personId);
    const householdId = await this.resolveHouseholdId(
      tenantId,
      personId,
      dto.householdId,
    );
    const expense = await this.prisma.personExpense.create({
      data: {
        tenantId,
        personId,
        householdId,
        type: normalizeString(dto.type) ?? 'Outro',
        amount: dto.amount,
        frequency: resolveIncomeFrequency(dto.frequency),
        isHouseholdExpense: dto.isHouseholdExpense ?? true,
        notes: normalizeString(dto.notes),
      },
    });
    return mapExpense(expense);
  }

  async updateExpense(
    tenantId: string,
    personId: string,
    expenseId: string,
    dto: UpdatePersonExpenseDto,
  ) {
    const expense = await this.prisma.personExpense.findFirst({
      where: { id: expenseId, tenantId, personId },
    });
    if (!expense) {
      throw new NotFoundException('Gasto nao encontrado.');
    }

    const updated = await this.prisma.personExpense.update({
      where: { id: expenseId },
      data: {
        householdId:
          dto.householdId !== undefined
            ? await this.resolveHouseholdId(tenantId, personId, dto.householdId)
            : undefined,
        type:
          dto.type !== undefined
            ? normalizeString(dto.type) ?? undefined
            : undefined,
        amount: dto.amount !== undefined ? dto.amount : undefined,
        frequency:
          dto.frequency !== undefined
            ? resolveIncomeFrequency(dto.frequency)
            : undefined,
        isHouseholdExpense:
          dto.isHouseholdExpense !== undefined
            ? dto.isHouseholdExpense
            : undefined,
        notes: dto.notes !== undefined ? normalizeString(dto.notes) : undefined,
      },
    });

    return mapExpense(updated);
  }

  async removeExpense(tenantId: string, personId: string, expenseId: string) {
    const expense = await this.prisma.personExpense.findFirst({
      where: { id: expenseId, tenantId, personId },
    });
    if (!expense) {
      throw new NotFoundException('Gasto nao encontrado.');
    }
    await this.prisma.personExpense.delete({ where: { id: expenseId } });
    return { deleted: true };
  }

  async removeIncome(tenantId: string, personId: string, incomeId: string) {
    const income = await this.prisma.personIncome.findFirst({
      where: { id: incomeId, tenantId, personId },
    });
    if (!income) {
      throw new NotFoundException('Renda nao encontrada.');
    }
    await this.prisma.personIncome.delete({ where: { id: incomeId } });
    return { deleted: true };
  }

  async listTransfers(tenantId: string, personId: string) {
    await this.findById(tenantId, personId);
    const transfers = await this.prisma.householdTransfer.findMany({
      where: { tenantId, personId },
      orderBy: { createdAt: 'desc' },
    });
    return transfers.map(mapTransfer);
  }

  async createTransfer(
    tenantId: string,
    personId: string,
    dto: CreateHouseholdTransferDto,
  ) {
    await this.findById(tenantId, personId);
    if (dto.fromHouseholdId === dto.toHouseholdId) {
      throw new BadRequestException(
        'Residencias de origem e destino devem ser diferentes.',
      );
    }

    const [fromHousehold, toHousehold] = await Promise.all([
      this.prisma.household.findFirst({
        where: { id: dto.fromHouseholdId, tenantId },
      }),
      this.prisma.household.findFirst({
        where: { id: dto.toHouseholdId, tenantId },
      }),
    ]);

    if (!fromHousehold || !toHousehold) {
      throw new BadRequestException('Residencia nao encontrada.');
    }

    const transfer = await this.prisma.householdTransfer.create({
      data: {
        tenantId,
        personId,
        fromHouseholdId: dto.fromHouseholdId,
        toHouseholdId: dto.toHouseholdId,
        type: resolveTransferType(dto.type),
        amount: dto.amount,
        frequency: resolveIncomeFrequency(dto.frequency),
        notes: normalizeString(dto.notes),
      },
    });

    return mapTransfer(transfer);
  }

  async updateTransfer(
    tenantId: string,
    personId: string,
    transferId: string,
    dto: UpdateHouseholdTransferDto,
  ) {
    const transfer = await this.prisma.householdTransfer.findFirst({
      where: { id: transferId, tenantId, personId },
    });
    if (!transfer) {
      throw new NotFoundException('Transferencia nao encontrada.');
    }

    const fromHouseholdId =
      dto.fromHouseholdId !== undefined ? dto.fromHouseholdId : transfer.fromHouseholdId;
    const toHouseholdId =
      dto.toHouseholdId !== undefined ? dto.toHouseholdId : transfer.toHouseholdId;
    if (fromHouseholdId === toHouseholdId) {
      throw new BadRequestException(
        'Residencias de origem e destino devem ser diferentes.',
      );
    }

    const [fromHousehold, toHousehold] = await Promise.all([
      this.prisma.household.findFirst({
        where: { id: fromHouseholdId, tenantId },
      }),
      this.prisma.household.findFirst({
        where: { id: toHouseholdId, tenantId },
      }),
    ]);
    if (!fromHousehold || !toHousehold) {
      throw new BadRequestException('Residencia nao encontrada.');
    }

    const updated = await this.prisma.householdTransfer.update({
      where: { id: transferId },
      data: {
        fromHouseholdId:
          dto.fromHouseholdId !== undefined ? dto.fromHouseholdId : undefined,
        toHouseholdId:
          dto.toHouseholdId !== undefined ? dto.toHouseholdId : undefined,
        type: dto.type !== undefined ? resolveTransferType(dto.type) : undefined,
        amount: dto.amount !== undefined ? dto.amount : undefined,
        frequency:
          dto.frequency !== undefined
            ? resolveIncomeFrequency(dto.frequency)
            : undefined,
        notes: dto.notes !== undefined ? normalizeString(dto.notes) : undefined,
      },
    });

    return mapTransfer(updated);
  }

  async removeTransfer(tenantId: string, personId: string, transferId: string) {
    const transfer = await this.prisma.householdTransfer.findFirst({
      where: { id: transferId, tenantId, personId },
    });
    if (!transfer) {
      throw new NotFoundException('Transferencia nao encontrada.');
    }
    await this.prisma.householdTransfer.delete({ where: { id: transferId } });
    return { deleted: true };
  }

  async listHouseholdAssets(tenantId: string, personId: string) {
    await this.findById(tenantId, personId);
    const membership = await this.prisma.householdMember.findFirst({
      where: { tenantId, personId },
    });
    if (!membership) return [];
    const assets = await this.prisma.householdAsset.findMany({
      where: { tenantId, householdId: membership.householdId },
      orderBy: { createdAt: 'desc' },
    });
    return assets.map(mapHouseholdAsset);
  }

  async createHouseholdAsset(
    tenantId: string,
    personId: string,
    dto: CreateHouseholdAssetDto,
  ) {
    await this.findById(tenantId, personId);
    return this.prisma.$transaction(async (tx) => {
      const householdId = await this.ensureHouseholdForPerson(
        tx,
        tenantId,
        personId,
      );
      const asset = await tx.householdAsset.create({
        data: {
          tenantId,
          householdId,
          category: normalizeString(dto.category) ?? dto.category,
          item: normalizeString(dto.item) ?? dto.item,
          quantity: dto.quantity ?? undefined,
          condition:
            dto.condition !== undefined ? normalizeString(dto.condition) : null,
          notes: dto.notes !== undefined ? normalizeString(dto.notes) : null,
        },
      });
      return mapHouseholdAsset(asset);
    });
  }

  async updateHouseholdAsset(
    tenantId: string,
    personId: string,
    assetId: string,
    dto: UpdateHouseholdAssetDto,
  ) {
    const membership = await this.prisma.householdMember.findFirst({
      where: { tenantId, personId },
    });
    if (!membership) {
      throw new NotFoundException('Residencia nao encontrada.');
    }
    const asset = await this.prisma.householdAsset.findFirst({
      where: { id: assetId, tenantId, householdId: membership.householdId },
    });
    if (!asset) {
      throw new NotFoundException('Bem da residencia nao encontrado.');
    }
    const updated = await this.prisma.householdAsset.update({
      where: { id: assetId },
      data: {
        category:
          dto.category !== undefined
            ? normalizeString(dto.category) ?? undefined
            : undefined,
        item:
          dto.item !== undefined
            ? normalizeString(dto.item) ?? undefined
            : undefined,
        quantity: dto.quantity !== undefined ? dto.quantity : undefined,
        condition:
          dto.condition !== undefined ? normalizeString(dto.condition) : undefined,
        notes: dto.notes !== undefined ? normalizeString(dto.notes) : undefined,
      },
    });
    return mapHouseholdAsset(updated);
  }

  async removeHouseholdAsset(
    tenantId: string,
    personId: string,
    assetId: string,
  ) {
    const membership = await this.prisma.householdMember.findFirst({
      where: { tenantId, personId },
    });
    if (!membership) {
      throw new NotFoundException('Residencia nao encontrada.');
    }
    const asset = await this.prisma.householdAsset.findFirst({
      where: { id: assetId, tenantId, householdId: membership.householdId },
    });
    if (!asset) {
      throw new NotFoundException('Bem da residencia nao encontrado.');
    }
    await this.prisma.householdAsset.delete({ where: { id: assetId } });
    return { deleted: true };
  }

  async listPersonAssets(tenantId: string, personId: string) {
    await this.findById(tenantId, personId);
    const assets = await this.prisma.personAsset.findMany({
      where: { tenantId, personId },
      orderBy: { createdAt: 'desc' },
    });
    return assets.map(mapPersonAsset);
  }

  async listHouseholdPersonAssets(tenantId: string, personId: string) {
    const person = await this.prisma.person.findFirst({
      where: { id: personId, tenantId },
    });
    if (!person) {
      throw new NotFoundException('Pessoa nao encontrada.');
    }
    const membership = await this.prisma.householdMember.findFirst({
      where: { tenantId, personId },
      include: { person: true },
    });

    if (!membership) {
      const assets = await this.prisma.personAsset.findMany({
        where: { tenantId, personId },
        orderBy: { createdAt: 'desc' },
      });
      return [
        {
          person: mapPersonSummaryFromRecord(person),
          assets: assets.map(mapPersonAsset),
        },
      ];
    }

    const members = await this.prisma.householdMember.findMany({
      where: { tenantId, householdId: membership.householdId },
      include: { person: true },
    });

    const memberIds = members.map((member) => member.personId);
    const assets = await this.prisma.personAsset.findMany({
      where: { tenantId, personId: { in: memberIds } },
      orderBy: { createdAt: 'desc' },
    });

    const grouped = assets.reduce<Record<string, PersonAssetRecord[]>>(
      (acc, asset) => {
        if (!acc[asset.personId]) acc[asset.personId] = [];
        acc[asset.personId].push(asset);
        return acc;
      },
      {},
    );

    return members.map((member) => ({
      person: mapPersonSummaryFromRecord(member.person),
      assets: (grouped[member.personId] ?? []).map(mapPersonAsset),
    }));
  }

  async createPersonAsset(
    tenantId: string,
    personId: string,
    dto: CreatePersonAssetDto,
  ) {
    await this.findById(tenantId, personId);
    const asset = await this.prisma.personAsset.create({
      data: {
        tenantId,
        personId,
        category: normalizeString(dto.category) ?? dto.category,
        item: normalizeString(dto.item) ?? dto.item,
        quantity: dto.quantity ?? undefined,
        condition:
          dto.condition !== undefined ? normalizeString(dto.condition) : null,
        notes: dto.notes !== undefined ? normalizeString(dto.notes) : null,
      },
    });
    return mapPersonAsset(asset);
  }

  async updatePersonAsset(
    tenantId: string,
    personId: string,
    assetId: string,
    dto: UpdatePersonAssetDto,
  ) {
    const asset = await this.prisma.personAsset.findFirst({
      where: { id: assetId, tenantId, personId },
    });
    if (!asset) {
      throw new NotFoundException('Bem pessoal nao encontrado.');
    }
    const updated = await this.prisma.personAsset.update({
      where: { id: assetId },
      data: {
        category:
          dto.category !== undefined
            ? normalizeString(dto.category) ?? undefined
            : undefined,
        item:
          dto.item !== undefined
            ? normalizeString(dto.item) ?? undefined
            : undefined,
        quantity: dto.quantity !== undefined ? dto.quantity : undefined,
        condition:
          dto.condition !== undefined ? normalizeString(dto.condition) : undefined,
        notes: dto.notes !== undefined ? normalizeString(dto.notes) : undefined,
      },
    });
    return mapPersonAsset(updated);
  }

  async removePersonAsset(
    tenantId: string,
    personId: string,
    assetId: string,
  ) {
    const asset = await this.prisma.personAsset.findFirst({
      where: { id: assetId, tenantId, personId },
    });
    if (!asset) {
      throw new NotFoundException('Bem pessoal nao encontrado.');
    }
    await this.prisma.personAsset.delete({ where: { id: assetId } });
    return { deleted: true };
  }

  async getHouseholdProfile(tenantId: string, personId: string) {
    await this.findById(tenantId, personId);
    const membership = await this.prisma.householdMember.findFirst({
      where: { tenantId, personId },
    });
    if (!membership) {
      return null;
    }
    const profile = await this.prisma.householdProfile.findUnique({
      where: { householdId: membership.householdId },
    });
    return profile ? mapHouseholdProfile(profile) : null;
  }

  async upsertHouseholdProfile(
    tenantId: string,
    personId: string,
    dto: UpsertHouseholdProfileDto,
  ) {
    await this.findById(tenantId, personId);
    const profile = await this.prisma.$transaction(async (tx) => {
      const householdId = await this.ensureHouseholdForPerson(
        tx,
        tenantId,
        personId,
      );
      const saved = await tx.householdProfile.upsert({
        where: { householdId },
        create: {
          tenantId,
          householdId,
          type: normalizeString(dto.type),
          condition: normalizeString(dto.condition),
          ownership: normalizeString(dto.ownership),
          areaM2: dto.areaM2 ?? null,
          rooms: dto.rooms ?? null,
          bathrooms: dto.bathrooms ?? null,
          notes: normalizeString(dto.notes),
        },
        update: {
          type: dto.type !== undefined ? normalizeString(dto.type) : undefined,
          condition:
            dto.condition !== undefined
              ? normalizeString(dto.condition)
              : undefined,
          ownership:
            dto.ownership !== undefined
              ? normalizeString(dto.ownership)
              : undefined,
          areaM2: dto.areaM2 !== undefined ? dto.areaM2 : undefined,
          rooms: dto.rooms !== undefined ? dto.rooms : undefined,
          bathrooms: dto.bathrooms !== undefined ? dto.bathrooms : undefined,
          notes: dto.notes !== undefined ? normalizeString(dto.notes) : undefined,
        },
      });
      return saved;
    });
    return mapHouseholdProfile(profile);
  }

  async getFamilyIncomeSummary(tenantId: string, personId: string) {
    await this.findById(tenantId, personId);

    const householdMember = await this.prisma.householdMember.findFirst({
      where: { tenantId, personId },
    });
    const householdId = householdMember?.householdId ?? null;
    const householdMemberIds = householdId
      ? (
          await this.prisma.householdMember.findMany({
            where: { tenantId, householdId },
            select: { personId: true },
          })
        ).map((member) => member.personId)
      : [personId];

    const relations = await this.prisma.personRelation.findMany({
      where: { tenantId, personId },
      select: { relatedPersonId: true },
    });
    const relatedIds = relations.map((relation) => relation.relatedPersonId);

    const personIds = Array.from(
      new Set([...householdMemberIds, ...relatedIds]),
    );

    const incomes = await this.prisma.personIncome.findMany({
      where: {
        tenantId,
        personId: { in: personIds },
        isHouseholdContribution: true,
        ...(householdId
          ? {
              OR: [
                { householdId },
                { householdId: null, personId: { in: householdMemberIds } },
              ],
            }
          : { householdId: null }),
      },
    });
    const expenses = await this.prisma.personExpense.findMany({
      where: {
        tenantId,
        personId: { in: personIds },
        isHouseholdExpense: true,
        ...(householdId
          ? {
              OR: [
                { householdId },
                { householdId: null, personId: { in: householdMemberIds } },
              ],
            }
          : { householdId: null }),
      },
    });
    const transfers = householdId
      ? await this.prisma.householdTransfer.findMany({
          where: {
            tenantId,
            OR: [{ fromHouseholdId: householdId }, { toHouseholdId: householdId }],
          },
        })
      : [];
    const incomingTransfers = householdId
      ? transfers.filter((transfer) => transfer.toHouseholdId === householdId)
      : [];
    const outgoingTransfers = householdId
      ? transfers.filter((transfer) => transfer.fromHouseholdId === householdId)
      : [];

    const contributionMap = new Map<string, number>();
    incomes.forEach((income) => {
      const current = contributionMap.get(income.personId) ?? 0;
      contributionMap.set(income.personId, current + Number(income.amount));
    });
    incomingTransfers.forEach((transfer) => {
      const current = contributionMap.get(transfer.personId) ?? 0;
      contributionMap.set(transfer.personId, current + Number(transfer.amount));
    });
    const totalIncome =
      incomes.reduce((sum, income) => sum + Number(income.amount), 0) +
      incomingTransfers.reduce(
        (sum, transfer) => sum + Number(transfer.amount),
        0,
      );
    const contributors = Array.from(contributionMap.keys());

    const benefitsTotal = incomes.reduce((sum, income) => {
      const category = normalizeCategory(income.type);
      if (category.includes('benef') || category.includes('bolsa') || category.includes('auxilio')) {
        return sum + Number(income.amount);
      }
      return sum;
    }, 0);

    const pensionIncomeTotal = incomes.reduce((sum, income) => {
      const category = normalizeCategory(income.type);
      if (category.includes('pensao')) {
        return sum + Number(income.amount);
      }
      return sum;
    }, 0);
    const pensionTransferTotal = incomingTransfers.reduce((sum, transfer) => {
      if (transfer.type === HouseholdTransferType.PENSION) {
        return sum + Number(transfer.amount);
      }
      return sum;
    }, 0);
    const pensionTotal = pensionIncomeTotal + pensionTransferTotal;
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0,
    ) + outgoingTransfers.reduce((sum, transfer) => sum + Number(transfer.amount), 0);

    const householdSize = householdMemberIds.length || 1;
    const perCapitaIncome = householdSize > 0 ? totalIncome / householdSize : 0;
    const perCapitaExpenses =
      householdSize > 0 ? totalExpenses / householdSize : 0;

    return {
      totalIncome,
      perCapitaIncome,
      totalExpenses,
      perCapitaExpenses,
      benefitsTotal,
      pensionTotal,
      householdSize,
      contributors,
      contributions: Array.from(contributionMap.entries()).map(
        ([personId, amount]) => ({
          personId,
          amount,
        }),
      ),
    };
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    await this.prisma.person.delete({ where: { id } });
    return { deleted: true };
  }

  async listRelations(tenantId: string, personId: string) {
    await this.findById(tenantId, personId);

    const householdMember = await this.prisma.householdMember.findFirst({
      where: { tenantId, personId },
      include: { household: true },
    });

    const householdMembers = householdMember?.householdId
      ? await this.prisma.householdMember.findMany({
          where: {
            tenantId,
            householdId: householdMember.householdId,
          },
          include: { person: true },
        })
      : [];

    const relations = await this.prisma.personRelation.findMany({
      where: { tenantId, personId },
      include: { relatedPerson: true },
    });

    const relationMap = new Map(
      relations.map((relation) => [relation.relatedPersonId, relation]),
    );
    const relatedIds = relations.map((relation) => relation.relatedPersonId);
    const relatedHouseholdMembers = relatedIds.length
      ? await this.prisma.householdMember.findMany({
          where: {
            tenantId,
            personId: { in: relatedIds },
            endDate: null,
          },
          include: { household: true, person: true },
        })
      : [];
    const relatedHouseholds = relatedHouseholdMembers.map((member) => {
      const relation = relationMap.get(member.personId);
      return {
        householdId: member.householdId,
        householdName: member.household?.name ?? null,
        personId: member.personId,
        personName: member.person.fullName,
        relationType: relation?.type ?? null,
        livesTogether: relation?.livesTogether ?? false,
      };
    });

    return {
      household: householdMember?.household
        ? {
            id: householdMember.household.id,
            name: householdMember.household.name,
          }
        : null,
      householdMembers: householdMembers
        .filter((member) => member.personId !== personId)
        .map((member) => ({
          id: member.id,
          personId: member.personId,
          role: member.role,
          isLegalGuardian: member.isLegalGuardian,
          isIncomeContributor: member.isIncomeContributor,
          isProvider: member.isProvider,
          isDependent: member.isDependent,
          notes: member.notes,
          startDate: member.startDate,
          endDate: member.endDate,
          person: mapPersonSummary(member.person),
        })),
      relations: relations.map((relation) => ({
        id: relation.id,
        personId: relation.personId,
        relatedPersonId: relation.relatedPersonId,
        type: relation.type,
        livesTogether: relation.livesTogether,
        isLegalGuardian: relation.isLegalGuardian,
        notes: relation.notes,
        createdAt: relation.createdAt,
        updatedAt: relation.updatedAt,
        relatedPerson: mapPersonSummary(relation.relatedPerson),
      })),
      relatedHouseholds,
    };
  }

  async createRelation(
    tenantId: string,
    personId: string,
    dto: CreatePersonRelationDto,
  ) {
    if (personId === dto.relatedPersonId) {
      throw new BadRequestException('A pessoa nao pode se relacionar com ela mesma.');
    }

    await this.findById(tenantId, personId);
    await this.findById(tenantId, dto.relatedPersonId);

    const type = normalizeString(dto.type) ?? 'Outro';
    const livesTogether = dto.livesTogether ?? false;
    const isLegalGuardian = dto.isLegalGuardian ?? false;

    const relation = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.personRelation.findFirst({
        where: {
          tenantId,
          personId,
          relatedPersonId: dto.relatedPersonId,
        },
      });

      const created = existing
        ? await tx.personRelation.update({
            where: { id: existing.id },
            data: {
              type,
              livesTogether,
              isLegalGuardian,
              notes: normalizeString(dto.notes),
            },
          })
        : await tx.personRelation.create({
            data: {
              tenantId,
              personId,
              relatedPersonId: dto.relatedPersonId,
              type,
              livesTogether,
              isLegalGuardian,
              notes: normalizeString(dto.notes),
            },
          });

      await this.syncInverseRelation(tx, tenantId, created);

      if (livesTogether) {
        const householdId = await this.ensureHouseholdForPerson(
          tx,
          tenantId,
          personId,
        );
        await this.ensureHouseholdMember(
          tx,
          tenantId,
          householdId,
          dto.relatedPersonId,
          dto,
        );
      } else {
        await this.removeHouseholdMember(
          tx,
          tenantId,
          personId,
          dto.relatedPersonId,
        );
      }

      return created;
    });

    return relation;
  }

  async updateRelation(
    tenantId: string,
    personId: string,
    relationId: string,
    dto: UpdatePersonRelationDto,
  ) {
    const relation = await this.prisma.personRelation.findFirst({
      where: { tenantId, id: relationId, personId },
    });

    if (!relation) {
      throw new NotFoundException('Relacionamento nao encontrado.');
    }

    const nextType = dto.type ? normalizeString(dto.type) ?? relation.type : relation.type;
    const nextLivesTogether =
      dto.livesTogether !== undefined ? dto.livesTogether : relation.livesTogether;
    const nextLegalGuardian =
      dto.isLegalGuardian !== undefined ? dto.isLegalGuardian : relation.isLegalGuardian;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.type) {
        const duplicate = await tx.personRelation.findFirst({
          where: {
            tenantId,
            personId,
            relatedPersonId: relation.relatedPersonId,
            type: nextType,
            NOT: { id: relation.id },
          },
        });
        if (duplicate) {
          await tx.personRelation.delete({ where: { id: duplicate.id } });
        }
      }

      const saved = await tx.personRelation.update({
        where: { id: relation.id },
        data: {
          type: nextType,
          livesTogether: nextLivesTogether,
          isLegalGuardian: nextLegalGuardian,
          notes: dto.notes !== undefined ? normalizeString(dto.notes) : relation.notes,
        },
      });

      await this.syncInverseRelation(tx, tenantId, saved);

      if (nextLivesTogether) {
        const householdId = await this.ensureHouseholdForPerson(
          tx,
          tenantId,
          personId,
        );
        await this.ensureHouseholdMember(
          tx,
          tenantId,
          householdId,
          relation.relatedPersonId,
          dto,
        );
      } else {
        await this.removeHouseholdMember(
          tx,
          tenantId,
          personId,
          relation.relatedPersonId,
        );
      }

      return saved;
    });

    return updated;
  }

  async removeRelation(tenantId: string, personId: string, relationId: string) {
    const relation = await this.prisma.personRelation.findFirst({
      where: { tenantId, id: relationId, personId },
    });

    if (!relation) {
      throw new NotFoundException('Relacionamento nao encontrado.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.personRelation.delete({ where: { id: relation.id } });
      await tx.personRelation.deleteMany({
        where: {
          tenantId,
          personId: relation.relatedPersonId,
          relatedPersonId: relation.personId,
        },
      });

      if (relation.livesTogether) {
        await this.removeHouseholdMember(
          tx,
          tenantId,
          personId,
          relation.relatedPersonId,
        );
      }
    });

    return { deleted: true };
  }

  private async ensureHouseholdForPerson(
    tx: Prisma.TransactionClient,
    tenantId: string,
    personId: string,
  ) {
    const existing = await tx.householdMember.findFirst({
      where: { tenantId, personId },
      include: { household: true },
    });
    const person = await tx.person.findUnique({
      where: { id: personId },
      select: { fullName: true },
    });
    const householdName = person?.fullName
      ? `Residencia de ${person.fullName}`
      : 'Residencia';
    if (existing) {
      if (!existing.household?.name) {
        await tx.household.update({
          where: { id: existing.householdId },
          data: { name: householdName },
        });
      }
      return existing.householdId;
    }

    const household = await tx.household.create({
      data: { tenantId, name: householdName },
    });
    await tx.householdMember.create({
      data: {
        tenantId,
        householdId: household.id,
        personId,
        role: 'Morador',
      },
    });
    return household.id;
  }

  private async ensureHouseholdMember(
    tx: Prisma.TransactionClient,
    tenantId: string,
    householdId: string,
    personId: string,
    dto: Pick<
      CreatePersonRelationDto & UpdatePersonRelationDto,
      | 'householdRole'
      | 'isIncomeContributor'
      | 'isProvider'
      | 'isDependent'
      | 'isLegalGuardian'
    >,
  ) {
    await tx.householdMember.upsert({
      where: { householdId_personId: { householdId, personId } },
      create: {
        tenantId,
        householdId,
        personId,
        role: normalizeString(dto.householdRole),
        isIncomeContributor: dto.isIncomeContributor ?? false,
        isProvider: dto.isProvider ?? false,
        isDependent: dto.isDependent ?? false,
        isLegalGuardian: dto.isLegalGuardian ?? false,
      },
      update: {
        role:
          dto.householdRole !== undefined
            ? normalizeString(dto.householdRole)
            : undefined,
        isIncomeContributor:
          dto.isIncomeContributor !== undefined
            ? dto.isIncomeContributor
            : undefined,
        isProvider:
          dto.isProvider !== undefined ? dto.isProvider : undefined,
        isDependent:
          dto.isDependent !== undefined ? dto.isDependent : undefined,
        isLegalGuardian:
          dto.isLegalGuardian !== undefined
            ? dto.isLegalGuardian
            : undefined,
      },
    });
  }

  private async removeHouseholdMember(
    tx: Prisma.TransactionClient,
    tenantId: string,
    personId: string,
    relatedPersonId: string,
  ) {
    const household = await tx.householdMember.findFirst({
      where: { tenantId, personId },
    });
    if (!household) return;
    await tx.householdMember.deleteMany({
      where: {
        tenantId,
        householdId: household.householdId,
        personId: relatedPersonId,
      },
    });
  }

  private async syncInverseRelation(
    tx: Prisma.TransactionClient,
    tenantId: string,
    relation: Prisma.PersonRelationUncheckedCreateInput & {
      id?: string;
      relatedPersonId: string;
      personId: string;
      type: string;
      livesTogether?: boolean;
      isLegalGuardian?: boolean;
      notes?: string | null;
    },
  ) {
    const inverseType = await resolveInverseType(tx, relation);
    const inverse = await tx.personRelation.findFirst({
      where: {
        tenantId,
        personId: relation.relatedPersonId,
        relatedPersonId: relation.personId,
      },
    });

    if (inverse) {
      await tx.personRelation.update({
        where: { id: inverse.id },
        data: {
          type: inverseType,
          livesTogether: relation.livesTogether ?? false,
          isLegalGuardian: relation.isLegalGuardian ?? false,
          notes: relation.notes ?? null,
        },
      });
      return;
    }

    await tx.personRelation.create({
      data: {
        tenantId,
        personId: relation.relatedPersonId,
        relatedPersonId: relation.personId,
        type: inverseType,
        livesTogether: relation.livesTogether ?? false,
        isLegalGuardian: relation.isLegalGuardian ?? false,
        notes: relation.notes ?? null,
      },
    });
  }
}

