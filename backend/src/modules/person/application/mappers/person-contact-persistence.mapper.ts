import type { Prisma } from '../../../../generated/prisma';
import { normalizeString } from '../../../../core/utils/strings';
import {
  normalizeEmailValue,
  normalizePhoneDigits,
} from '../../domain/normalizers/person-field.normalizer';
import { assertPersonContactName } from '../../domain/validators/person-contact.validator';
import type {
  CreatePersonContactInput,
  UpdatePersonContactInput,
} from '../types/person-contact.input';

const normalizeContactValue = (type: 'EMAIL' | 'PHONE', value: string) =>
  type === 'EMAIL' ? normalizeEmailValue(value) : normalizePhoneDigits(value);

export const buildCreatePersonContactData = (
  tenantId: string,
  personId: string,
  dto: CreatePersonContactInput,
) => {
  const type = dto.type;
  const role = dto.role ?? 'SELF';
  const name = normalizeString(dto.name);

  assertPersonContactName(role, name);

  return {
    tenantId,
    personId,
    type,
    role,
    value: normalizeContactValue(type, dto.value),
    label: normalizeString(dto.label),
    name,
    relationship: normalizeString(dto.relationship),
    isPrimary: dto.isPrimary ?? false,
    isWhatsapp: type === 'PHONE' ? (dto.isWhatsapp ?? false) : false,
    notes: normalizeString(dto.notes),
  } as const;
};

export const buildUpdatePersonContactData = (
  existing: Prisma.PersonContactGetPayload<{}>,
  dto: UpdatePersonContactInput,
): {
  nextType: 'EMAIL' | 'PHONE';
  updateData: Prisma.PersonContactUpdateInput;
} => {
  const nextType = dto.type ?? existing.type;
  const nextRole = dto.role ?? existing.role;
  const nextValue =
    dto.value !== undefined
      ? normalizeContactValue(nextType, dto.value)
      : existing.value;
  const nextName =
    dto.name !== undefined ? normalizeString(dto.name) : existing.name;

  assertPersonContactName(nextRole, nextName);

  return {
    nextType,
    updateData: {
      type: dto.type !== undefined ? nextType : undefined,
      role: dto.role !== undefined ? nextRole : undefined,
      value: dto.value !== undefined ? nextValue : undefined,
      label: dto.label !== undefined ? normalizeString(dto.label) : undefined,
      name: dto.name !== undefined ? nextName : undefined,
      relationship:
        dto.relationship !== undefined
          ? normalizeString(dto.relationship)
          : undefined,
      isPrimary: dto.isPrimary !== undefined ? dto.isPrimary : undefined,
      isWhatsapp:
        dto.isWhatsapp !== undefined
          ? nextType === 'PHONE'
            ? dto.isWhatsapp
            : false
          : undefined,
      notes: dto.notes !== undefined ? normalizeString(dto.notes) : undefined,
    },
  };
};