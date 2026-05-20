import type { Prisma } from '../../../../generated/prisma';

type PersonRecord = Prisma.PersonGetPayload<{}>;
type PersonWithHealthCounts = Prisma.PersonGetPayload<{
  include: {
    _count: {
      select: {
        healthConditions: true;
        medications: true;
      };
    };
  };
}>;
type PersonWithDetailRelations = Prisma.PersonGetPayload<{
  include: {
    _count: {
      select: {
        healthConditions: true;
        medications: true;
      };
    };
    comments: {
      orderBy: {
        createdAt: 'desc';
      };
      include: {
        authorUser: {
          select: {
            id: true;
            name: true;
            email: true;
            avatarUrl: true;
          };
        };
      };
    };
    attachments: {
      orderBy: {
        createdAt: 'desc';
      };
      include: {
        uploadedByUser: {
          select: {
            id: true;
            name: true;
            email: true;
            avatarUrl: true;
          };
        };
      };
    };
  };
}>;
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
    personType: true;
  };
}>;
type PersonIncomeRecord = Prisma.PersonIncomeGetPayload<{}>;
type PersonExpenseRecord = Prisma.PersonExpenseGetPayload<{}>;
type PersonFinancialEntryRecord = Prisma.PersonFinancialEntryGetPayload<{}>;
type PersonBenefitRecord = Prisma.PersonBenefitGetPayload<{}>;
type HouseholdProfileRecord = Prisma.HouseholdProfileGetPayload<{}>;
type HouseholdAssetRecord = Prisma.HouseholdAssetGetPayload<{}>;
type PersonAssetRecord = Prisma.PersonAssetGetPayload<{}>;
type HouseholdTransferRecord = Prisma.HouseholdTransferGetPayload<{}>;
type PersonHealthConditionRecord = Prisma.PersonHealthConditionGetPayload<{}>;
type PersonMedicationRecord = Prisma.PersonMedicationGetPayload<{}>;
type PersonEducationRecord = Prisma.PersonEducationGetPayload<{}>;
type PersonDetentionRecord = Prisma.PersonDetentionGetPayload<{}>;
type PersonContactRecord = Prisma.PersonContactGetPayload<{}>;
type PersonRecordCommentRecord = Prisma.PersonRecordCommentGetPayload<{
  include: {
    authorUser: {
      select: {
        id: true;
        name: true;
        email: true;
        avatarUrl: true;
      };
    };
  };
}>;
type PersonRecordAttachmentRecord = Prisma.PersonRecordAttachmentGetPayload<{
  include: {
    uploadedByUser: {
      select: {
        id: true;
        name: true;
        email: true;
        avatarUrl: true;
      };
    };
  };
}>;

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

const parseMentionUserIds = (value: Prisma.JsonValue | null | undefined) => {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(value.map((entry) => String(entry ?? '').trim()).filter(Boolean)),
  );
};

const mapCommentAuthor = (
  user:
    | {
        id: string;
        name: string | null;
        email: string | null;
        avatarUrl: string | null;
      }
    | null
    | undefined,
) => ({
  id: user?.id ?? null,
  name: user?.name?.trim() || user?.email || 'Equipe interna',
  email: user?.email ?? null,
  avatarUrl: user?.avatarUrl ?? null,
});

export const mapPersonCommentItem = (
  comment:
    | {
        id: string;
        body: string;
        mentionUserIds: Prisma.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        authorUser?: {
          id: string;
          name: string | null;
          email: string | null;
          avatarUrl: string | null;
        } | null;
      }
    | PersonRecordCommentRecord,
) => ({
  id: comment.id,
  body: comment.body,
  mentionUserIds: parseMentionUserIds(comment.mentionUserIds),
  author: mapCommentAuthor(comment.authorUser),
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

export const mapPersonAttachmentItem = (
  attachment:
    | {
        id: string;
        label: string;
        filePath: string;
        mimeType: string | null;
        fileSizeBytes: number | null;
        createdAt: Date;
        updatedAt: Date;
        uploadedByUser?: {
          id: string;
          name: string | null;
          email: string | null;
          avatarUrl: string | null;
        } | null;
      }
    | PersonRecordAttachmentRecord,
) => ({
  id: attachment.id,
  label: attachment.label,
  filePath: attachment.filePath,
  mimeType: attachment.mimeType ?? null,
  fileSizeBytes: attachment.fileSizeBytes ?? null,
  uploadedBy: attachment.uploadedByUser
    ? {
        id: attachment.uploadedByUser.id,
        name:
          attachment.uploadedByUser.name?.trim() ||
          attachment.uploadedByUser.email ||
          'Equipe interna',
        email: attachment.uploadedByUser.email ?? null,
        avatarUrl: attachment.uploadedByUser.avatarUrl ?? null,
      }
    : null,
  createdAt: attachment.createdAt,
  updatedAt: attachment.updatedAt,
});

export const mapPerson = (
  person: PersonWithHealthCounts | PersonWithDetailRelations,
) => {
  const { _count, tags, comments, attachments, ...rest } =
    person as PersonWithDetailRelations & PersonWithHealthCounts;

  return {
    ...rest,
    document: null,
    rg: null,
    nis: null,
    tags: parseTags(tags),
    comments: comments?.map(mapPersonCommentItem) ?? [],
    attachments: attachments?.map(mapPersonAttachmentItem) ?? [],
    hasHealthCondition: _count.healthConditions > 0,
    hasMedication: _count.medications > 0,
    hasHealthIssue: _count.healthConditions + _count.medications > 0,
  };
};

export const mapPersonSummary = (person: PersonSummary) => ({
  id: person.id,
  fullName: person.fullName,
  avatarUrl: person.avatarUrl,
  birthDate: person.birthDate,
  sex: person.sex,
  gender: person.gender,
  raceColor: person.raceColor,
  status: person.status,
  personType: person.personType,
});

export const mapPersonSummaryFromRecord = (person: PersonRecord) => ({
  id: person.id,
  fullName: person.fullName,
  avatarUrl: person.avatarUrl,
  birthDate: person.birthDate,
  sex: person.sex,
  gender: person.gender,
  raceColor: person.raceColor,
  status: person.status,
  personType: person.personType,
});

export const mapIncome = (income: PersonIncomeRecord) => ({
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

export const mapExpense = (expense: PersonExpenseRecord) => ({
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

export const mapFinancialEntry = (entry: PersonFinancialEntryRecord) => ({
  id: entry.id,
  personId: entry.personId,
  householdId: entry.householdId ?? null,
  fromHouseholdId: entry.fromHouseholdId ?? null,
  toHouseholdId: entry.toHouseholdId ?? null,
  entryType: entry.entryType,
  category: entry.category,
  subcategory: entry.subcategory,
  status: entry.status,
  amount: entry.amount !== null ? Number(entry.amount) : null,
  frequency: entry.frequency,
  contractType: entry.contractType,
  includeInHouseholdBudget: entry.includeInHouseholdBudget,
  startDate: entry.startDate,
  endDate: entry.endDate,
  notes: entry.notes,
  createdAt: entry.createdAt,
  updatedAt: entry.updatedAt,
});

export const mapBenefit = (benefit: PersonBenefitRecord) => ({
  id: benefit.id,
  personId: benefit.personId,
  householdId: benefit.householdId ?? null,
  type: benefit.type,
  status: benefit.status,
  amount: benefit.amount !== null ? Number(benefit.amount) : null,
  frequency: benefit.frequency,
  startDate: benefit.startDate,
  endDate: benefit.endDate,
  notes: benefit.notes,
  createdAt: benefit.createdAt,
  updatedAt: benefit.updatedAt,
});

export const mapTransfer = (transfer: HouseholdTransferRecord) => ({
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

export const mapHouseholdProfile = (profile: HouseholdProfileRecord) => ({
  id: profile.id,
  householdId: profile.householdId,
  type: profile.type,
  condition: profile.condition,
  ownership: profile.ownership,
  areaM2: profile.areaM2,
  rooms: profile.rooms,
  bathrooms: profile.bathrooms,
  cep: profile.cep,
  street: profile.street,
  number: profile.number,
  complement: profile.complement,
  neighborhood: profile.neighborhood,
  city: profile.city,
  state: profile.state,
  ibge: profile.ibge,
  gia: profile.gia,
  ddd: profile.ddd,
  siafi: profile.siafi,
  reference: profile.reference,
  notes: profile.notes,
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt,
});

export const mapHouseholdAsset = (asset: HouseholdAssetRecord) => ({
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

export const mapPersonAsset = (asset: PersonAssetRecord) => ({
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

export const mapHealthCondition = (condition: PersonHealthConditionRecord) => ({
  id: condition.id,
  personId: condition.personId,
  type: condition.type,
  description: condition.description,
  severity: condition.severity,
  diagnosisDate: condition.diagnosisDate,
  documentUrl: condition.documentUrl,
  notes: condition.notes,
  createdAt: condition.createdAt,
  updatedAt: condition.updatedAt,
});

export const mapMedication = (medication: PersonMedicationRecord) => ({
  id: medication.id,
  personId: medication.personId,
  reason: medication.reason,
  medication: medication.medication,
  dosage: medication.dosage,
  schedule: medication.schedule,
  startDate: medication.startDate,
  endDate: medication.endDate,
  prescribingDoctor: medication.prescribingDoctor,
  permissionDocumentUrl: medication.permissionDocumentUrl,
  documentUrl: medication.documentUrl,
  notes: medication.notes,
  createdAt: medication.createdAt,
  updatedAt: medication.updatedAt,
});

export const mapEducation = (education: PersonEducationRecord) => ({
  id: education.id,
  personId: education.personId,
  level: education.level,
  status: education.status,
  institution: education.institution,
  grade: education.grade,
  schoolYear: education.schoolYear,
  isCurrent: education.isCurrent,
  startDate: education.startDate,
  endDate: education.endDate,
  notes: education.notes,
  createdAt: education.createdAt,
  updatedAt: education.updatedAt,
});

export const mapDetention = (detention: PersonDetentionRecord) => ({
  id: detention.id,
  personId: detention.personId,
  status: detention.status,
  type: detention.type,
  unit: detention.unit,
  startDate: detention.startDate,
  endDate: detention.endDate,
  notes: detention.notes,
  createdAt: detention.createdAt,
  updatedAt: detention.updatedAt,
});

export const mapPersonContact = (contact: PersonContactRecord) => ({
  id: contact.id,
  personId: contact.personId,
  role: contact.role,
  type: contact.type,
  label: contact.label,
  name: contact.name,
  relationship: contact.relationship,
  value: contact.value,
  isPrimary: contact.isPrimary,
  isWhatsapp: contact.isWhatsapp,
  notes: contact.notes,
  createdAt: contact.createdAt,
  updatedAt: contact.updatedAt,
});