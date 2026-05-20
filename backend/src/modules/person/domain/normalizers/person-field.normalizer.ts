import { DomainValidationError } from '../../../../core/errors/domain.error';
import { isEmail } from 'class-validator';
import { isValidCpfDigits, normalizeCpfOrNull } from '../../../../core/utils/cpf';
import { normalizeString } from '../../../../core/utils/strings';

export type IncomeFrequencyValue =
  | 'MONTHLY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'ANNUAL'
  | 'ONCE';

export type HouseholdTransferTypeValue = 'PENSION' | 'TRANSFER';

export type PersonFinancialEntryTypeValue =
  | 'INCOME'
  | 'EXPENSE'
  | 'TRANSFER'
  | 'BENEFIT';

const INCOME_FREQUENCY_VALUES = [
  'MONTHLY',
  'WEEKLY',
  'BIWEEKLY',
  'ANNUAL',
  'ONCE',
] as const;

const HOUSEHOLD_TRANSFER_TYPE_VALUES = ['PENSION', 'TRANSFER'] as const;
const FINANCIAL_ENTRY_TYPE_VALUES = [
  'INCOME',
  'EXPENSE',
  'TRANSFER',
  'BENEFIT',
] as const;

export const normalizeCepDigitsOrNull = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const digits = trimmed.replaceAll(/\D/g, '');
  if (digits.length !== 8) {
    throw new DomainValidationError('CEP inválido.');
  }

  return digits;
};

export const normalizeTags = (tags?: string[] | null) => {
  if (!tags) return null;

  const cleaned = tags.map((tag) => tag.trim()).filter(Boolean);
  return cleaned.length ? JSON.stringify(cleaned) : null;
};

export const normalizeStatus = (status?: string | null) => {
  const normalized = normalizeString(status);
  return normalized === 'Em analise' ? 'Em espera' : normalized;
};

export const normalizePhoneDigits = (value: string) => {
  const digits = value.replaceAll(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) {
    throw new DomainValidationError('Telefone inválido.');
  }

  return digits;
};

export const normalizeEmailValue = (value: string) => {
  const email = value.trim().toLowerCase();
  if (!email || !isEmail(email)) {
    throw new DomainValidationError('Email inválido.');
  }

  return email;
};

const normalizeFreeformId = (value: string) =>
  value
    .trim()
    .replaceAll(/\s+/g, ' ')
    .replaceAll(/[^\w.\-()/ ]/g, '');

export const normalizeCpfDigitsOrNull = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const digits = normalizeCpfOrNull(trimmed);
  if (!digits || !isValidCpfDigits(digits)) {
    throw new DomainValidationError('CPF inválido.');
  }

  return digits;
};

export const normalizeRgOrNull = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const normalized = normalizeFreeformId(trimmed);
  if (normalized.length < 4) {
    throw new DomainValidationError('RG inválido.');
  }

  return normalized;
};

export const normalizeNisDigitsOrNull = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const digits = trimmed.replaceAll(/\D/g, '');
  if (digits.length !== 11) {
    throw new DomainValidationError('NIS inválido.');
  }

  return digits;
};

export const normalizeCnsDigitsOrNull = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const digits = trimmed.replaceAll(/\D/g, '');
  if (digits.length !== 15) {
    throw new DomainValidationError('CNS inválido.');
  }

  return digits;
};

export const normalizeOptionalUrl = (value?: string | null) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  return normalizeString(value) ?? undefined;
};

export const normalizeCategory = (value?: string | null) =>
  (value ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const resolveIncomeFrequency = (
  value?: string | null
): IncomeFrequencyValue => {
  const normalized = value?.toString().toUpperCase();

  return (
    INCOME_FREQUENCY_VALUES.find((item) => item === normalized) ?? 'MONTHLY'
  ) as IncomeFrequencyValue;
};

export const resolveTransferType = (
  value?: string | null
): HouseholdTransferTypeValue => {
  const normalized = value?.toString().toUpperCase();

  return (
    HOUSEHOLD_TRANSFER_TYPE_VALUES.find((item) => item === normalized) ??
    'PENSION'
  ) as HouseholdTransferTypeValue;
};

export const resolveFinancialEntryType = (
  value?: string | null
): PersonFinancialEntryTypeValue => {
  const normalized = (value ?? '').toString().trim().toUpperCase();

  return (
    FINANCIAL_ENTRY_TYPE_VALUES.find((item) => item === normalized) ?? 'INCOME'
  ) as PersonFinancialEntryTypeValue;
};