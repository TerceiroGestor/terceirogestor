import type { Prisma } from '../../../generated/prisma';
import { parseDateInput } from '../../../../core/utils/dates';
import { parseJsonArray } from '../../../core/utils/json';

export type AdvancedFilter = {
  columnId: string;
  operator:
    | 'equals'
    | 'contains'
    | 'in'
    | 'notIn'
    | 'isEmpty'
    | 'isNotEmpty'
    | 'between'
    | 'gt'
    | 'lt'
    | 'gte'
    | 'lte'
    | 'starts'
    | 'ends';
  value: string;
};

const SEARCH_FIELDS = [
  'fullName',
  'socialName',
  'document',
  'rg',
  'nis',
  'email',
  'phone',
  'maritalStatus',
  'nationality',
  'status',
  'personType',
  'departureReason',
  'notes',
  'profileSummary',
  'tags',
] as const;

const ALLOWED_FILTER_FIELDS = new Set([
  'fullName',
  'socialName',
  'birthDate',
  'sex',
  'gender',
  'raceColor',
  'maritalStatus',
  'nationality',
  'email',
  'phone',
  'document',
  'rg',
  'nis',
  'personType',
  'status',
  'departureReason',
  'notes',
  'profileSummary',
  'avatarUrl',
  'tags',
  'hasHealthIssue',
  'hasHealthCondition',
  'hasMedication',
  'createdAt',
  'updatedAt',
]);

const VIRTUAL_FILTER_FIELDS = new Set([
  'hasHealthIssue',
  'hasHealthCondition',
  'hasMedication',
]);

const DATE_FIELDS = new Set(['birthDate', 'createdAt', 'updatedAt']);

const parseBetween = (raw: string) =>
  raw
    .split('..')
    .flatMap((part) => part.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

const parseList = (raw: string) =>
  raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const parseAdvancedFilters = (raw?: string) =>
  parseJsonArray<AdvancedFilter>(raw);

export const parseGrouping = (raw?: string) => parseJsonArray<string>(raw);

export const buildPersonWhere = ({
  tenantId,
  query,
  filters,
}: {
  tenantId: string;
  query?: string;
  filters: AdvancedFilter[];
}): Prisma.PersonWhereInput => {
  const andFilters: Prisma.PersonWhereInput[] = [];
  const q = query?.trim();

  if (q) {
    andFilters.push({
      OR: SEARCH_FIELDS.map((field) => ({
        [field]: { contains: q },
      })) as Prisma.PersonWhereInput[],
    });
  }

  filters
    .map((filter) => buildAdvancedFilter(filter))
    .filter(Boolean)
    .forEach((filter) => andFilters.push(filter as Prisma.PersonWhereInput));

  return {
    tenantId,
    ...(andFilters.length ? { AND: andFilters } : {}),
  };
};

export const buildPersonOrderBy = (
  grouping: string[],
): Prisma.PersonOrderByWithRelationInput[] => {
  const orderBy: Prisma.PersonOrderByWithRelationInput[] = [];
  grouping
    .filter((field, index, arr) => arr.indexOf(field) === index)
    .forEach((field) => {
      if (
        ALLOWED_FILTER_FIELDS.has(field) &&
        !VIRTUAL_FILTER_FIELDS.has(field)
      ) {
        orderBy.push({
          [field]: 'asc',
        } as Prisma.PersonOrderByWithRelationInput);
      }
    });

  if (!grouping.includes('fullName')) {
    orderBy.push({ fullName: 'asc' });
  }

  return orderBy;
};

const buildAdvancedFilter = (
  filter: AdvancedFilter,
): Prisma.PersonWhereInput | null => {
  const field = filter.columnId;
  if (!ALLOWED_FILTER_FIELDS.has(field)) return null;
  const rawValue = filter.value?.trim();
  if (
    (!rawValue || rawValue === '') &&
    filter.operator !== 'isEmpty' &&
    filter.operator !== 'isNotEmpty'
  ) {
    return null;
  }

  const isDateField = DATE_FIELDS.has(field);
  if (
    isDateField &&
    ['contains', 'starts', 'ends', 'in', 'notIn'].includes(filter.operator)
  ) {
    return null;
  }

  if (isDateField) {
    if (filter.operator === 'isEmpty') {
      return { [field]: null } as Prisma.PersonWhereInput;
    }
    if (filter.operator === 'isNotEmpty') {
      return { NOT: { [field]: null } } as Prisma.PersonWhereInput;
    }
    if (filter.operator === 'between') {
      const [startRaw, endRaw] = parseBetween(rawValue);
      if (!startRaw || !endRaw) return null;
      const start = parseDateInput(startRaw);
      const end = parseDateInput(endRaw, { endOfDay: true });
      if (!start || !end) return null;
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return null;
      }
      return {
        [field]: {
          gte: start,
          lte: end,
        },
      } as Prisma.PersonWhereInput;
    }

    const dateValue = parseDateInput(rawValue);
    if (!dateValue) return null;
    if (Number.isNaN(dateValue.getTime())) return null;

    switch (filter.operator) {
      case 'equals':
        return { [field]: { equals: dateValue } } as Prisma.PersonWhereInput;
      case 'gt':
        return { [field]: { gt: dateValue } } as Prisma.PersonWhereInput;
      case 'gte':
        return { [field]: { gte: dateValue } } as Prisma.PersonWhereInput;
      case 'lte':
        return { [field]: { lte: dateValue } } as Prisma.PersonWhereInput;
      case 'lt':
        return { [field]: { lt: dateValue } } as Prisma.PersonWhereInput;
      default:
        return null;
    }
  }

  if (
    field === 'hasHealthIssue' ||
    field === 'hasHealthCondition' ||
    field === 'hasMedication'
  ) {
    const normalized = rawValue?.toLowerCase();
    if (!normalized) return null;
    const isTrue = ['true', '1', 'sim', 'yes'].includes(normalized);
    const isFalse = ['false', '0', 'nao', 'não', 'no'].includes(normalized);
    if (!isTrue && !isFalse) return null;

    if (field === 'hasHealthCondition') {
      return isTrue
        ? { healthConditions: { some: {} } }
        : { healthConditions: { none: {} } };
    }

    if (field === 'hasMedication') {
      return isTrue
        ? { medications: { some: {} } }
        : { medications: { none: {} } };
    }

    return isTrue
      ? {
          OR: [
            { healthConditions: { some: {} } },
            { medications: { some: {} } },
          ],
        }
      : {
          AND: [
            { healthConditions: { none: {} } },
            { medications: { none: {} } },
          ],
        };
  }

  if (field === 'tags') {
    if (filter.operator === 'isEmpty') {
      return {
        OR: [{ tags: null }, { tags: '' }, { tags: '[]' }],
      } as Prisma.PersonWhereInput;
    }
    if (filter.operator === 'isNotEmpty') {
      return {
        NOT: {
          OR: [{ tags: null }, { tags: '' }, { tags: '[]' }],
        },
      } as Prisma.PersonWhereInput;
    }
  }

  if (filter.operator === 'isEmpty') {
    return { [field]: null } as Prisma.PersonWhereInput;
  }
  if (filter.operator === 'isNotEmpty') {
    return { NOT: { [field]: null } } as Prisma.PersonWhereInput;
  }

  switch (filter.operator) {
    case 'equals':
      return { [field]: rawValue } as Prisma.PersonWhereInput;
    case 'contains':
      return { [field]: { contains: rawValue } } as Prisma.PersonWhereInput;
    case 'starts':
      return { [field]: { startsWith: rawValue } } as Prisma.PersonWhereInput;
    case 'ends':
      return { [field]: { endsWith: rawValue } } as Prisma.PersonWhereInput;
    case 'in': {
      const values = parseList(rawValue);
      return values.length
        ? ({ [field]: { in: values } } as Prisma.PersonWhereInput)
        : null;
    }
    case 'notIn': {
      const values = parseList(rawValue);
      return values.length
        ? ({ [field]: { notIn: values } } as Prisma.PersonWhereInput)
        : null;
    }
    case 'between': {
      const [startRaw, endRaw] = parseBetween(rawValue);
      const start = Number(startRaw);
      const end = Number(endRaw);
      if (Number.isNaN(start) || Number.isNaN(end)) return null;
      return {
        [field]: {
          gte: start,
          lte: end,
        },
      } as Prisma.PersonWhereInput;
    }
    case 'gt': {
      const value = Number(rawValue);
      return Number.isNaN(value)
        ? null
        : ({ [field]: { gt: value } } as Prisma.PersonWhereInput);
    }
    case 'gte': {
      const value = Number(rawValue);
      return Number.isNaN(value)
        ? null
        : ({ [field]: { gte: value } } as Prisma.PersonWhereInput);
    }
    case 'lt': {
      const value = Number(rawValue);
      return Number.isNaN(value)
        ? null
        : ({ [field]: { lt: value } } as Prisma.PersonWhereInput);
    }
    case 'lte': {
      const value = Number(rawValue);
      return Number.isNaN(value)
        ? null
        : ({ [field]: { lte: value } } as Prisma.PersonWhereInput);
    }
    default:
      return null;
  }
};