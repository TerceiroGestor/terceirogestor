import type { Prisma } from '../../../../generated/prisma';
import { parseDateInput } from '../../../../core/utils/dates';
import { normalizeString } from '../../../../core/utils/strings';
import type {
  CreatePersonInput,
  UpdatePersonInput,
} from '../types/person-crud.input';
import {
  normalizeStatus,
  normalizeTags,
} from '../../domain/normalizers/person-field.normalizer';

export const buildCreatePersonData = (
  tenantId: string,
  dto: CreatePersonInput,
): Prisma.PersonUncheckedCreateInput => {
  const normalizedStatus = normalizeStatus(dto.status);

  return {
    tenantId,
    fullName: dto.fullName.trim(),
    socialName: normalizeString(dto.socialName),
    birthDate: dto.birthDate ? (parseDateInput(dto.birthDate) ?? null) : null,
    sex: normalizeString(dto.sex),
    gender: normalizeString(dto.gender),
    raceColor: normalizeString(dto.raceColor),
    maritalStatus: normalizeString(dto.maritalStatus),
    nationality: normalizeString(dto.nationality),
    email: normalizeString(dto.email),
    phone: normalizeString(dto.phone),
    document: null,
    rg: null,
    nis: null,
    personType: normalizeString(dto.personType) ?? 'Atendido',
    status: normalizedStatus,
    departureReason:
      normalizedStatus === 'Desligado'
        ? normalizeString(dto.departureReason)
        : null,
    notes: normalizeString(dto.notes),
    tags: normalizeTags(dto.tags),
    profileSummary: normalizeString(dto.profileSummary),
    avatarUrl: normalizeString(dto.avatarUrl),
  };
};

export const buildUpdatePersonData = (
  dto: UpdatePersonInput,
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
    data.birthDate = dto.birthDate
      ? (parseDateInput(dto.birthDate) ?? null)
      : null;
  }
  if (dto.personType !== undefined) {
    data.personType = normalizeString(dto.personType) ?? 'Atendido';
  }
  if (dto.status !== undefined) {
    data.status = normalizeStatus(dto.status);
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
  if (dto.profileSummary !== undefined) {
    data.profileSummary = normalizeString(dto.profileSummary);
  }
  if (dto.avatarUrl !== undefined) {
    data.avatarUrl = normalizeString(dto.avatarUrl);
  }

  return data;
};