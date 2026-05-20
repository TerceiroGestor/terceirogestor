import type { CreatePersonDto } from '../../dto/create-person.dto';
import type { CreatePersonContactDto } from '../../dto/create-person-contact.dto';
import type { ListPersonQueryDto } from '../../dto/list-person-query.dto';
import type { UpdatePersonContactDto } from '../../dto/update-person-contact.dto';
import type { UpdatePersonDto } from '../../dto/update-person.dto';
import type { UpsertPersonSensitiveDocumentsDto } from '../../dto/upsert-person-sensitive-documents.dto';
import type {
  CreatePersonContactInput,
  UpdatePersonContactInput,
} from '../../application/types/person-contact.input';
import type {
  CreatePersonInput,
  ListPersonInput,
  UpdatePersonInput,
} from '../../application/types/person-crud.input';
import type { UpsertPersonSensitiveDocumentsInput } from '../../application/types/person-sensitive-documents.input';

export const mapCreatePersonDtoToInput = (
  dto: CreatePersonDto,
): CreatePersonInput => ({
  fullName: dto.fullName,
  socialName: dto.socialName,
  birthDate: dto.birthDate,
  sex: dto.sex,
  gender: dto.gender,
  maritalStatus: dto.maritalStatus,
  raceColor: dto.raceColor,
  nationality: dto.nationality,
  email: dto.email,
  phone: dto.phone,
  status: dto.status,
  personType: dto.personType,
  departureReason: dto.departureReason,
  notes: dto.notes,
  tags: dto.tags,
  profileSummary: dto.profileSummary,
  avatarUrl: dto.avatarUrl,
});

export const mapUpdatePersonDtoToInput = (
  dto: UpdatePersonDto,
): UpdatePersonInput => ({
  fullName: dto.fullName,
  socialName: dto.socialName,
  birthDate: dto.birthDate,
  sex: dto.sex,
  gender: dto.gender,
  maritalStatus: dto.maritalStatus,
  raceColor: dto.raceColor,
  nationality: dto.nationality,
  email: dto.email,
  phone: dto.phone,
  status: dto.status,
  personType: dto.personType,
  departureReason: dto.departureReason,
  notes: dto.notes,
  tags: dto.tags,
  profileSummary: dto.profileSummary,
  avatarUrl: dto.avatarUrl,
});

export const mapListPersonQueryDtoToInput = (
  dto: ListPersonQueryDto,
): ListPersonInput => ({
  all: dto.all,
  page: dto.page,
  limit: dto.limit,
  q: dto.q,
  filters: dto.filters,
  groupBy: dto.groupBy,
});

export const mapCreatePersonContactDtoToInput = (
  dto: CreatePersonContactDto,
): CreatePersonContactInput => ({
  type: dto.type,
  value: dto.value,
  role: dto.role,
  label: dto.label,
  name: dto.name,
  relationship: dto.relationship,
  isPrimary: dto.isPrimary,
  isWhatsapp: dto.isWhatsapp,
  notes: dto.notes,
});

export const mapUpdatePersonContactDtoToInput = (
  dto: UpdatePersonContactDto,
): UpdatePersonContactInput => ({
  type: dto.type,
  value: dto.value,
  role: dto.role,
  label: dto.label,
  name: dto.name,
  relationship: dto.relationship,
  isPrimary: dto.isPrimary,
  isWhatsapp: dto.isWhatsapp,
  notes: dto.notes,
});

export const mapUpsertPersonSensitiveDocumentsDtoToInput = (
  dto: UpsertPersonSensitiveDocumentsDto,
): UpsertPersonSensitiveDocumentsInput => ({
  cpf: dto.cpf,
  rg: dto.rg,
  nis: dto.nis,
  cns: dto.cns,
});