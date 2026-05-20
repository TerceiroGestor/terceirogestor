import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CepService } from '../../core/cep/cep.service';
import { parseDateInput } from '../../core/utils/dates';
import { normalizeString } from '../../core/utils/strings';
import {
  mapBenefit,
  mapDetention,
  mapExpense,
  mapFinancialEntry,
  mapHouseholdAsset,
  mapHouseholdProfile,
  mapIncome,
  mapPersonAsset,
  mapPersonAttachmentItem,
  mapPersonCommentItem,
  mapPersonContact,
  mapPersonSummary,
  mapPersonSummaryFromRecord,
  mapTransfer,
} from './application/mappers/person-response.mapper';
import {
  PERSON_RECORD_TYPES,
  type PersonRecordType,
} from './domain/constants/person.constants';
import {
  PERSON_DETAIL_INCLUDE,
  PERSON_RECORD_ATTACHMENT_INCLUDE,
  PERSON_RECORD_COMMENT_INCLUDE,
} from './infrastructure/persistence/person-prisma.constants';
import {
  normalizeCategory,
  normalizeCepDigitsOrNull,
  normalizeStatus,
  normalizeTags,
  resolveFinancialEntryType,
  resolveIncomeFrequency,
  resolveTransferType,
} from './domain/normalizers/person-field.normalizer';
import {
  isGenealogyRelation,
  requiresPersonContextForInverseType,
  resolveInverseType,
} from './domain/policies/person-relation.policy';
import { assertDepartureReasonForStatus } from './domain/validators/person-status.validator';
import { CreateHouseholdAssetDto } from './dto/create-household-asset.dto';
import { CreatePersonAssetDto } from './dto/create-person-asset.dto';
import { CreatePersonAttachmentDto } from './dto/create-person-attachment.dto';
import { CreatePersonCommentDto } from './dto/create-person-comment.dto';
import { CreatePersonRecordAttachmentDto } from './dto/create-person-record-attachment.dto';
import { CreatePersonRecordCommentDto } from './dto/create-person-record-comment.dto';
import { CreatePersonDto } from './dto/create-person.dto';
import { CreatePersonExpenseDto } from './dto/create-person-expense.dto';
import { CreatePersonFinancialEntryDto } from './dto/create-person-financial-entry.dto';
import { CreatePersonHealthConditionDto } from './dto/create-person-health-condition.dto';
import { CreatePersonIncomeDto } from './dto/create-person-income.dto';
import { CreatePersonMedicationDto } from './dto/create-person-medication.dto';
import { CreatePersonRelationDto } from './dto/create-person-relation.dto';
import { CreateHouseholdTransferDto } from './dto/create-household-transfer.dto';
import { CreatePersonEducationDto } from './dto/create-person-education.dto';
import { CreatePersonBenefitDto } from './dto/create-person-benefit.dto';
import { CreatePersonDetentionDto } from './dto/create-person-detention.dto';
import { UpdateHouseholdAssetDto } from './dto/update-household-asset.dto';
import { UpsertHouseholdProfileDto } from './dto/upsert-household-profile.dto';
import { UpdatePersonAssetDto } from './dto/update-person-asset.dto';
import { UpdatePersonExpenseDto } from './dto/update-person-expense.dto';
import { UpdatePersonFinancialEntryDto } from './dto/update-person-financial-entry.dto';
import { UpdatePersonHealthConditionDto } from './dto/update-person-health-condition.dto';
import { UpdatePersonIncomeDto } from './dto/update-person-income.dto';
import { UpdatePersonMedicationDto } from './dto/update-person-medication.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { UpdateHouseholdTransferDto } from './dto/update-household-transfer.dto';
import { UpdatePersonEducationDto } from './dto/update-person-education.dto';
import { UpdatePersonBenefitDto } from './dto/update-person-benefit.dto';
import { UpdatePersonDetentionDto } from './dto/update-person-detention.dto';
import { UpdatePersonRelationDto } from './dto/update-person-relation.dto';
import { isPersonUploadPathAllowed } from './infrastructure/persistence/person-upload-path.policy';
import { CreatePersonUseCase } from './application/use-cases/create-person.use-case';
import { PersonFinanceService } from './application/services/person-finance.service';
import { PersonAssetHouseholdService } from './application/services/person-asset-household.service';
import { PersonBenefitDetentionService } from './application/services/person-benefit-detention.service';
import { PersonHealthEducationService } from './application/services/person-health-education.service';
import { PersonRecordMetadataService } from './application/services/person-record-metadata.service';
import { PersonRelationService } from './application/services/person-relation.service';
import { GetPersonByIdUseCase } from './application/use-cases/get-person-by-id.use-case';
import { GetPersonSensitiveDocumentsUseCase } from './application/use-cases/get-person-sensitive-documents.use-case';
import { ListPersonUseCase } from './application/use-cases/list-person.use-case';
import { ListPersonContactsUseCase } from './application/use-cases/list-person-contacts.use-case';
import { RemovePersonContactUseCase } from './application/use-cases/remove-person-contact.use-case';
import { UpdatePersonContactUseCase } from './application/use-cases/update-person-contact.use-case';
import { UpdatePersonUseCase } from './application/use-cases/update-person.use-case';
import { UpsertPersonSensitiveDocumentsUseCase } from './application/use-cases/upsert-person-sensitive-documents.use-case';
import type {
  CreatePersonContactInput,
  UpdatePersonContactInput,
} from './application/types/person-contact.input';
import type {
  CreatePersonInput,
  ListPersonInput,
  UpdatePersonInput,
} from './application/types/person-crud.input';
import type { UpsertPersonSensitiveDocumentsInput } from './application/types/person-sensitive-documents.input';
import type {
  CreatePersonExpenseInput,
  CreatePersonFinancialEntryInput,
  CreatePersonIncomeInput,
  UpdatePersonExpenseInput,
  UpdatePersonFinancialEntryInput,
  UpdatePersonIncomeInput,
} from './application/types/person-finance.input';
import type {
  CreatePersonRelationInput,
  UpdatePersonRelationInput,
} from './application/types/person-relation.input';

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
type HouseholdMemberRecord = Prisma.HouseholdMemberGetPayload<{
  include: { person: true };
}>;
type PersonRelationRecord = Prisma.PersonRelationGetPayload<{
  include: { relatedPerson: true };
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
type PersonSensitiveDocumentRecord =
  Prisma.PersonSensitiveDocumentGetPayload<{}>;
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

@Injectable()
/**
 * @deprecated Fachada transicional para manter compatibilidade externa enquanto os fluxos restantes migram para use cases.
 * Remover ou reduzir ao minimo quando comments, attachments, relations e demais subfluxos sairem do arquivo raiz.
 */
export class PersonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cep: CepService,
    private readonly createPersonUseCase: CreatePersonUseCase,
    private readonly listPersonUseCase: ListPersonUseCase,
    private readonly getPersonByIdUseCase: GetPersonByIdUseCase,
    private readonly updatePersonUseCase: UpdatePersonUseCase,
    private readonly listPersonContactsUseCase: ListPersonContactsUseCase,
    private readonly createPersonContactUseCase: CreatePersonContactUseCase,
    private readonly updatePersonContactUseCase: UpdatePersonContactUseCase,
    private readonly removePersonContactUseCase: RemovePersonContactUseCase,
    private readonly getPersonSensitiveDocumentsUseCase: GetPersonSensitiveDocumentsUseCase,
    private readonly upsertPersonSensitiveDocumentsUseCase: UpsertPersonSensitiveDocumentsUseCase,
    private readonly personFinanceService: PersonFinanceService,
    private readonly personAssetHouseholdService: PersonAssetHouseholdService,
    private readonly personBenefitDetentionService: PersonBenefitDetentionService,
    private readonly personHealthEducationService: PersonHealthEducationService,
    private readonly personRecordMetadataService: PersonRecordMetadataService,
    private readonly personRelationService: PersonRelationService,
  ) {}

  async create(tenantId: string, input: CreatePersonInput) {
    return this.createPersonUseCase.execute(tenantId, input);
  }

  async findAll(tenantId: string, input: ListPersonInput) {
    return this.listPersonUseCase.execute(tenantId, input);
  }

  async findById(tenantId: string, id: string) {
    return this.getPersonByIdUseCase.execute(tenantId, id);
  }

  async update(tenantId: string, id: string, input: UpdatePersonInput) {
    return this.updatePersonUseCase.execute(tenantId, id, input);
  }

  async addComment(
    tenantId: string,
    actorUserId: string,
    personId: string,
    dto: CreatePersonCommentDto,
  ) {
    return this.personRecordMetadataService.addComment(
      tenantId,
      actorUserId,
      personId,
      dto,
    );
  }

  async deleteComment(tenantId: string, personId: string, commentId: string) {
    return this.personRecordMetadataService.deleteComment(
      tenantId,
      personId,
      commentId,
    );
  }

  async addAttachment(
    tenantId: string,
    actorUserId: string,
    personId: string,
    dto: CreatePersonAttachmentDto,
  ) {
    return this.personRecordMetadataService.addAttachment(
      tenantId,
      actorUserId,
      personId,
      dto,
    );
  }

  async deleteAttachment(
    tenantId: string,
    personId: string,
    attachmentId: string,
  ) {
    return this.personRecordMetadataService.deleteAttachment(
      tenantId,
      personId,
      attachmentId,
    );
  }

  async getRecordMetadata(
    tenantId: string,
    personId: string,
    recordTypeRaw: string,
    recordId: string,
  ) {
    return this.personRecordMetadataService.getRecordMetadata(
      tenantId,
      personId,
      recordTypeRaw,
      recordId,
    );
  }

  async addRecordComment(
    tenantId: string,
    actorUserId: string,
    personId: string,
    recordTypeRaw: string,
    recordId: string,
    dto: CreatePersonRecordCommentDto,
  ) {
    return this.personRecordMetadataService.addRecordComment(
      tenantId,
      actorUserId,
      personId,
      recordTypeRaw,
      recordId,
      dto,
    );
  }

  async deleteRecordComment(
    tenantId: string,
    personId: string,
    recordTypeRaw: string,
    recordId: string,
    commentId: string,
  ) {
    return this.personRecordMetadataService.deleteRecordComment(
      tenantId,
      personId,
      recordTypeRaw,
      recordId,
      commentId,
    );
  }

  async addRecordAttachment(
    tenantId: string,
    actorUserId: string,
    personId: string,
    recordTypeRaw: string,
    recordId: string,
    dto: CreatePersonRecordAttachmentDto,
  ) {
    return this.personRecordMetadataService.addRecordAttachment(
      tenantId,
      actorUserId,
      personId,
      recordTypeRaw,
      recordId,
      dto,
    );
  }

  async deleteRecordAttachment(
    tenantId: string,
    personId: string,
    recordTypeRaw: string,
    recordId: string,
    attachmentId: string,
  ) {
    return this.personRecordMetadataService.deleteRecordAttachment(
      tenantId,
      personId,
      recordTypeRaw,
      recordId,
      attachmentId,
    );
  }

  async setRecordTags(
    tenantId: string,
    personId: string,
    recordTypeRaw: string,
    recordId: string,
    tags: string[],
  ) {
    return this.personRecordMetadataService.setRecordTags(
      tenantId,
      personId,
      recordTypeRaw,
      recordId,
      tags,
    );
  }




  private async resolveMentionUserIds(
    tenantId: string,
    mentionUserIds?: string[] | null,
  ) {
    const normalized = Array.from(
      new Set(
        (mentionUserIds ?? []).map((entry) => entry.trim()).filter(Boolean),
      ),
    );

    if (!normalized.length) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        id: { in: normalized },
      },
      select: { id: true },
    });

    return users.map((user) => user.id);
  }

  private getSensitiveAccessMeta() {
    const ctx = this.requestContext.get();
    const userId = ctx?.userId ?? null;
    if (!userId) {
      throw new BadRequestException('Contexto de usuário não encontrado.');
    }
    return {
      userId,
      ipAddress: ctx?.ipAddress ?? null,
      userAgent: ctx?.userAgent ?? null,
    };
  }

  private async logSensitiveAccess(
    tenantId: string,
    personId: string,
    action: 'READ' | 'UPDATE',
  ) {
    const meta = this.getSensitiveAccessMeta();
    await this.prisma.personSensitiveAccessLog.create({
      data: {
        tenantId,
        personId,
        userId: meta.userId,
        action,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });
  }

  async getSensitiveDocuments(tenantId: string, personId: string) {
    await this.findById(tenantId, personId);
    await this.logSensitiveAccess(tenantId, personId, 'READ');

    const record = await this.prisma.personSensitiveDocument.findFirst({
      where: { tenantId, personId },
    });
    if (!record) return null;

    const payload = this.pii.decryptForTenant<SensitiveDocumentsPayloadV1>(
      tenantId,
      {
        dataEnc: record.dataEnc,
        iv: record.iv,
        tag: record.tag,
      },
    );

    return {
      ...payload,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async upsertSensitiveDocuments(
    tenantId: string,
    personId: string,
    dto: UpsertPersonSensitiveDocumentsDto,
  ) {
    await this.findById(tenantId, personId);

    const existing = await this.prisma.personSensitiveDocument.findFirst({
      where: { tenantId, personId },
    });

    const current = existing
      ? this.pii.decryptForTenant<SensitiveDocumentsPayloadV1>(tenantId, {
          dataEnc: existing.dataEnc,
          iv: existing.iv,
          tag: existing.tag,
        })
      : ({
          cpf: null,
          rg: null,
          nis: null,
          cns: null,
        } satisfies SensitiveDocumentsPayloadV1);

    const next: SensitiveDocumentsPayloadV1 = {
      cpf:
        dto.cpf !== undefined ? normalizeCpfDigitsOrNull(dto.cpf) : current.cpf,
      rg: dto.rg !== undefined ? normalizeRgOrNull(dto.rg) : current.rg,
      nis:
        dto.nis !== undefined ? normalizeNisDigitsOrNull(dto.nis) : current.nis,
      cns:
        dto.cns !== undefined ? normalizeCnsDigitsOrNull(dto.cns) : current.cns,
    };

    const encrypted = this.pii.encryptForTenant(tenantId, next);

    const saved = await this.prisma.$transaction(async (tx) => {
      const doc = await tx.personSensitiveDocument.upsert({
        where: { personId },
        create: {
          tenantId,
          personId,
          schemaVersion: 1,
          dataEnc: encrypted.dataEnc,
          iv: encrypted.iv,
          tag: encrypted.tag,
        },
        update: {
          schemaVersion: 1,
          dataEnc: encrypted.dataEnc,
          iv: encrypted.iv,
          tag: encrypted.tag,
        },
      });

      await tx.person.update({
        where: { id: personId },
        data: { document: null, rg: null, nis: null },
      });

      return doc;
    });

    await this.logSensitiveAccess(tenantId, personId, 'UPDATE');

    const payload = this.pii.decryptForTenant<SensitiveDocumentsPayloadV1>(
      tenantId,
      {
        dataEnc: saved.dataEnc,
        iv: saved.iv,
        tag: saved.tag,
      },
    );

    return {
      ...payload,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  async listContacts(tenantId: string, personId: string) {
    await this.findById(tenantId, personId);
    const contacts = await this.prisma.personContact.findMany({
      where: { tenantId, personId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
    return contacts.map(mapPersonContact);
  }

  async createContact(
    tenantId: string,
    personId: string,
    dto: CreatePersonContactDto,
  ) {
    await this.findById(tenantId, personId);
    return this.createPersonContactUseCase.execute(tenantId, personId, dto);
  }

  async updateContact(
    tenantId: string,
    personId: string,
    contactId: string,
    dto: UpdatePersonContactDto,
  ) {
    await this.findById(tenantId, personId);

    const existing = await this.prisma.personContact.findFirst({
      where: { id: contactId, tenantId, personId },
    });
    if (!existing) {
      throw new NotFoundException('Contato não encontrado.');
    }
    const { nextType, updateData } = buildUpdatePersonContactData(
      existing,
      dto,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary === true) {
        await tx.personContact.updateMany({
          where: { tenantId, personId, type: nextType, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      return tx.personContact.update({
        where: { id: contactId },
        data: updateData,
      });
    });

    return mapPersonContact(updated);
  }

  async removeContact(tenantId: string, personId: string, contactId: string) {
    await this.findById(tenantId, personId);
    const contact = await this.prisma.personContact.findFirst({
      where: { id: contactId, tenantId, personId },
    });
    if (!contact) {
      throw new NotFoundException('Contato não encontrado.');
    }
    await this.prisma.personContact.delete({ where: { id: contactId } });
    return { deleted: true };
  }

  async listIncomes(tenantId: string, personId: string) {
    return this.personFinanceService.listIncomes(tenantId, personId);
  }

  async listFinancialEntries(tenantId: string, personId: string) {
    return this.personFinanceService.listFinancialEntries(tenantId, personId);
  }

  async createFinancialEntry(
    tenantId: string,
    personId: string,
    input: CreatePersonFinancialEntryInput,
  ) {
    return this.personFinanceService.createFinancialEntry(
      tenantId,
      personId,
      input,
    );
  }

  async updateFinancialEntry(
    tenantId: string,
    personId: string,
    entryId: string,
    input: UpdatePersonFinancialEntryInput,
  ) {
    return this.personFinanceService.updateFinancialEntry(
      tenantId,
      personId,
      entryId,
      input,
    );
  }

  async removeFinancialEntry(
    tenantId: string,
    personId: string,
    entryId: string,
  ) {
    return this.personFinanceService.removeFinancialEntry(
      tenantId,
      personId,
      entryId,
    );
  }

  async listExpenses(tenantId: string, personId: string) {
    return this.personFinanceService.listExpenses(tenantId, personId);
  }

  async createIncome(
    tenantId: string,
    personId: string,
    input: CreatePersonIncomeInput,
  ) {
    return this.personFinanceService.createIncome(tenantId, personId, input);
  }

  async updateIncome(
    tenantId: string,
    personId: string,
    incomeId: string,
    input: UpdatePersonIncomeInput,
  ) {
    return this.personFinanceService.updateIncome(
      tenantId,
      personId,
      incomeId,
      input,
    );
  }

  async createExpense(
    tenantId: string,
    personId: string,
    input: CreatePersonExpenseInput,
  ) {
    return this.personFinanceService.createExpense(tenantId, personId, input);
  }

  async updateExpense(
    tenantId: string,
    personId: string,
    expenseId: string,
    input: UpdatePersonExpenseInput,
  ) {
    return this.personFinanceService.updateExpense(
      tenantId,
      personId,
      expenseId,
      input,
    );
  }

  async removeExpense(tenantId: string, personId: string, expenseId: string) {
    return this.personFinanceService.removeExpense(tenantId, personId, expenseId);
  }

  async removeIncome(tenantId: string, personId: string, incomeId: string) {
    return this.personFinanceService.removeIncome(tenantId, personId, incomeId);
  }

  async listHealthConditions(tenantId: string, personId: string) {
    return this.personHealthEducationService.listHealthConditions(
      tenantId,
      personId,
    );
  }

  async createHealthCondition(
    tenantId: string,
    personId: string,
    dto: CreatePersonHealthConditionDto,
  ) {
    return this.personHealthEducationService.createHealthCondition(
      tenantId,
      personId,
      dto,
    );
  }

  async updateHealthCondition(
    tenantId: string,
    personId: string,
    conditionId: string,
    dto: UpdatePersonHealthConditionDto,
  ) {
    return this.personHealthEducationService.updateHealthCondition(
      tenantId,
      personId,
      conditionId,
      dto,
    );
  }

  async removeHealthCondition(
    tenantId: string,
    personId: string,
    conditionId: string,
  ) {
    return this.personHealthEducationService.removeHealthCondition(
      tenantId,
      personId,
      conditionId,
    );
  }

  async listMedications(tenantId: string, personId: string) {
    return this.personHealthEducationService.listMedications(
      tenantId,
      personId,
    );
  }

  async createMedication(
    tenantId: string,
    personId: string,
    dto: CreatePersonMedicationDto,
  ) {
    return this.personHealthEducationService.createMedication(
      tenantId,
      personId,
      dto,
    );
  }

  async updateMedication(
    tenantId: string,
    personId: string,
    medicationId: string,
    dto: UpdatePersonMedicationDto,
  ) {
    return this.personHealthEducationService.updateMedication(
      tenantId,
      personId,
      medicationId,
      dto,
    );
  }

  async removeMedication(
    tenantId: string,
    personId: string,
    medicationId: string,
  ) {
    return this.personHealthEducationService.removeMedication(
      tenantId,
      personId,
      medicationId,
    );
  }

  async listEducations(tenantId: string, personId: string) {
    return this.personHealthEducationService.listEducations(
      tenantId,
      personId,
    );
  }

  async createEducation(
    tenantId: string,
    personId: string,
    dto: CreatePersonEducationDto,
  ) {
    return this.personHealthEducationService.createEducation(
      tenantId,
      personId,
      dto,
    );
  }

  async updateEducation(
    tenantId: string,
    personId: string,
    educationId: string,
    dto: UpdatePersonEducationDto,
  ) {
    return this.personHealthEducationService.updateEducation(
      tenantId,
      personId,
      educationId,
      dto,
    );
  }

  async removeEducation(
    tenantId: string,
    personId: string,
    educationId: string,
  ) {
    return this.personHealthEducationService.removeEducation(
      tenantId,
      personId,
      educationId,
    );
  }

  async listBenefits(tenantId: string, personId: string) {
    return this.personBenefitDetentionService.listBenefits(tenantId, personId);
  }

  async createBenefit(
    tenantId: string,
    personId: string,
    dto: CreatePersonBenefitDto,
  ) {
    return this.personBenefitDetentionService.createBenefit(
      tenantId,
      personId,
      dto,
    );
  }

  async updateBenefit(
    tenantId: string,
    personId: string,
    benefitId: string,
    dto: UpdatePersonBenefitDto,
  ) {
    return this.personBenefitDetentionService.updateBenefit(
      tenantId,
      personId,
      benefitId,
      dto,
    );
  }

  async removeBenefit(tenantId: string, personId: string, benefitId: string) {
    return this.personBenefitDetentionService.removeBenefit(
      tenantId,
      personId,
      benefitId,
    );
  }

  async listDetentions(tenantId: string, personId: string) {
    return this.personBenefitDetentionService.listDetentions(tenantId, personId);
  }

  async createDetention(
    tenantId: string,
    personId: string,
    dto: CreatePersonDetentionDto,
  ) {
    return this.personBenefitDetentionService.createDetention(
      tenantId,
      personId,
      dto,
    );
  }

  async updateDetention(
    tenantId: string,
    personId: string,
    detentionId: string,
    dto: UpdatePersonDetentionDto,
  ) {
    return this.personBenefitDetentionService.updateDetention(
      tenantId,
      personId,
      detentionId,
      dto,
    );
  }

  async removeDetention(
    tenantId: string,
    personId: string,
    detentionId: string,
  ) {
    return this.personBenefitDetentionService.removeDetention(
      tenantId,
      personId,
      detentionId,
    );
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
      dto.fromHouseholdId !== undefined
        ? dto.fromHouseholdId
        : transfer.fromHouseholdId;
    const toHouseholdId =
      dto.toHouseholdId !== undefined
        ? dto.toHouseholdId
        : transfer.toHouseholdId;
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
        type:
          dto.type !== undefined ? resolveTransferType(dto.type) : undefined,
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
      return this.personAssetHouseholdService.listHouseholdAssets(tenantId, personId);
  }

  async createHouseholdAsset(
    tenantId: string,
    personId: string,
    dto: CreateHouseholdAssetDto,
  ) {
      return this.personAssetHouseholdService.createHouseholdAsset(tenantId, personId, dto);
  }

  async updateHouseholdAsset(
    tenantId: string,
    personId: string,
    assetId: string,
    dto: UpdateHouseholdAssetDto,
  ) {
      return this.personAssetHouseholdService.updateHouseholdAsset(tenantId, personId, assetId, dto);
  }

  async removeHouseholdAsset(
    tenantId: string,
    personId: string,
    assetId: string,
  ) {
      return this.personAssetHouseholdService.removeHouseholdAsset(tenantId, personId, assetId);
  }

  async listPersonAssets(tenantId: string, personId: string) {
     return this.personAssetHouseholdService.listPersonAssets(tenantId, personId);
  }

  async listHouseholdPersonAssets(tenantId: string, personId: string) {
      return this.personAssetHouseholdService.listHouseholdPersonAssets(tenantId, personId);
  }

  async createPersonAsset(
    tenantId: string,
    personId: string,
    dto: CreatePersonAssetDto,
  ) {
    return this.personAssetHouseholdService.createPersonAsset(tenantId, personId, dto);
  }

  async updatePersonAsset(
    tenantId: string,
    personId: string,
    assetId: string,
    dto: UpdatePersonAssetDto,
  ) {
    return this.personAssetHouseholdService.updatePersonAsset(tenantId, personId, assetId, dto);
  }

  async removePersonAsset(tenantId: string, personId: string, assetId: string) {
    return this.personAssetHouseholdService.removePersonAsset(tenantId, personId, assetId);
  }

  async getHouseholdProfile(tenantId: string, personId: string) {
    return this.personAssetHouseholdService.getHouseholdProfile(tenantId, personId);
  }

  async upsertHouseholdProfile(
    tenantId: string,
    personId: string,
    dto: UpsertHouseholdProfileDto,
  ) {
    return this.personAssetHouseholdService.upsertHouseholdProfile(tenantId, personId, dto);
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

    const entries = await this.prisma.personFinancialEntry.findMany({
      where: {
        tenantId,
        personId: { in: personIds },
        includeInHouseholdBudget: true,
        ...(householdId
          ? {
              OR: [
                { householdId },
                { householdId: null, personId: { in: householdMemberIds } },
                { fromHouseholdId: householdId },
                { toHouseholdId: householdId },
              ],
            }
          : { householdId: null }),
      },
    });
    const incomes = entries.filter((entry) => entry.entryType === 'INCOME');
    const expenses = entries.filter((entry) => entry.entryType === 'EXPENSE');
    const benefits = entries.filter((entry) => entry.entryType === 'BENEFIT');
    const transfers = entries.filter((entry) => entry.entryType === 'TRANSFER');
    const incomingTransfers = householdId
      ? transfers.filter((transfer) => transfer.toHouseholdId === householdId)
      : [];
    const outgoingTransfers = householdId
      ? transfers.filter((transfer) => transfer.fromHouseholdId === householdId)
      : [];

    const isBenefitIncome = (type: string) => {
      const category = normalizeCategory(type);
      return (
        category.includes('benef') ||
        category.includes('bolsa') ||
        category.includes('auxilio') ||
        category.includes('bpc')
      );
    };

    const regularIncomes = incomes.filter(
      (income) => !isBenefitIncome(income.category),
    );
    const benefitIncomes = incomes.filter((income) =>
      isBenefitIncome(income.category),
    );

    const now = new Date();
    const activeBenefitsWithAmount = benefits.filter((benefit) => {
      if (benefit.amount === null) return false;
      const startsOk = !benefit.startDate || benefit.startDate <= now;
      const endsOk = !benefit.endDate || benefit.endDate >= now;
      return startsOk && endsOk;
    });
    const benefitsTotalFromBenefits = activeBenefitsWithAmount.reduce(
      (sum, benefit) => sum + Number(benefit.amount ?? 0),
      0,
    );
    const benefitsTotalFromIncomes = benefitIncomes.reduce(
      (sum, income) => sum + Number(income.amount ?? 0),
      0,
    );
    const hasBenefitAmounts = activeBenefitsWithAmount.length > 0;
    const benefitsTotal = hasBenefitAmounts
      ? benefitsTotalFromBenefits
      : benefitsTotalFromIncomes;

    const contributionMap = new Map<string, number>();
    regularIncomes.forEach((income) => {
      const current = contributionMap.get(income.personId) ?? 0;
      contributionMap.set(
        income.personId,
        current + Number(income.amount ?? 0),
      );
    });
    incomingTransfers.forEach((transfer) => {
      const current = contributionMap.get(transfer.personId) ?? 0;
      contributionMap.set(
        transfer.personId,
        current + Number(transfer.amount ?? 0),
      );
    });
    if (hasBenefitAmounts) {
      activeBenefitsWithAmount.forEach((benefit) => {
        const current = contributionMap.get(benefit.personId) ?? 0;
        contributionMap.set(
          benefit.personId,
          current + Number(benefit.amount ?? 0),
        );
      });
    } else {
      benefitIncomes.forEach((income) => {
        const current = contributionMap.get(income.personId) ?? 0;
        contributionMap.set(
          income.personId,
          current + Number(income.amount ?? 0),
        );
      });
    }

    const totalIncome =
      regularIncomes.reduce(
        (sum, income) => sum + Number(income.amount ?? 0),
        0,
      ) +
      benefitsTotal +
      incomingTransfers.reduce(
        (sum, transfer) => sum + Number(transfer.amount ?? 0),
        0,
      );
    const contributors = Array.from(contributionMap.keys());

    const pensionIncomeTotal = incomes.reduce((sum, income) => {
      const category = normalizeCategory(income.category);
      if (category.includes('pensao')) {
        return sum + Number(income.amount ?? 0);
      }
      return sum;
    }, 0);
    const pensionTransferTotal = incomingTransfers.reduce((sum, transfer) => {
      if (String(transfer.category).toUpperCase() === 'PENSION') {
        return sum + Number(transfer.amount ?? 0);
      }
      return sum;
    }, 0);
    const pensionTotal = pensionIncomeTotal + pensionTransferTotal;
    const totalExpenses =
      expenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0) +
      outgoingTransfers.reduce(
        (sum, transfer) => sum + Number(transfer.amount ?? 0),
        0,
      );

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

  async getFamilySummary(tenantId: string, personId: string) {
    await this.findById(tenantId, personId);

    const householdMember = await this.prisma.householdMember.findFirst({
      where: { tenantId, personId },
      select: { householdId: true },
    });
    const householdId = householdMember?.householdId ?? null;

    const [
      totalRelations,
      externalCount,
      externalGuardiansCount,
      householdCount,
      householdGuardiansCount,
      householdProvidersCount,
      householdDependentsCount,
    ] = await Promise.all([
      this.prisma.personRelation.count({
        where: { tenantId, personId },
      }),
      this.prisma.personRelation.count({
        where: { tenantId, personId, livesTogether: false },
      }),
      this.prisma.personRelation.count({
        where: {
          tenantId,
          personId,
          livesTogether: false,
          isLegalGuardian: true,
        },
      }),
      householdId
        ? this.prisma.householdMember.count({
            where: { tenantId, householdId },
          })
        : Promise.resolve(0),
      householdId
        ? this.prisma.householdMember.count({
            where: { tenantId, householdId, isLegalGuardian: true },
          })
        : Promise.resolve(0),
      householdId
        ? this.prisma.householdMember.count({
            where: { tenantId, householdId, isProvider: true },
          })
        : Promise.resolve(0),
      householdId
        ? this.prisma.householdMember.count({
            where: { tenantId, householdId, isDependent: true },
          })
        : Promise.resolve(0),
    ]);

    const guardiansCount = householdGuardiansCount + externalGuardiansCount;

    let sharedCount = 0;
    let individualCount = 0;

    if (householdId) {
      const [sharedSum, sharedNulls, memberIds] = await Promise.all([
        this.prisma.householdAsset.aggregate({
          where: { tenantId, householdId },
          _sum: { quantity: true },
        }),
        this.prisma.householdAsset.count({
          where: { tenantId, householdId, quantity: null },
        }),
        this.prisma.householdMember.findMany({
          where: { tenantId, householdId },
          select: { personId: true },
        }),
      ]);

      sharedCount = Number(sharedSum._sum.quantity ?? 0) + sharedNulls;

      const personIds = memberIds.map((member) => member.personId);
      if (personIds.length) {
        const [individualSum, individualNulls] = await Promise.all([
          this.prisma.personAsset.aggregate({
            where: { tenantId, personId: { in: personIds } },
            _sum: { quantity: true },
          }),
          this.prisma.personAsset.count({
            where: { tenantId, personId: { in: personIds }, quantity: null },
          }),
        ]);
        individualCount =
          Number(individualSum._sum.quantity ?? 0) + individualNulls;
      }
    }

    const [incomeSummary, householdProfile] = await Promise.all([
      this.getFamilyIncomeSummary(tenantId, personId),
      this.getHouseholdProfile(tenantId, personId),
    ]);

    return {
      relations: {
        livingCount: householdCount,
        externalCount,
        guardiansCount,
        providersCount: householdProvidersCount,
        dependentsCount: householdDependentsCount,
        totalRelations,
      },
      assets: {
        sharedCount,
        individualCount,
      },
      incomeSummary,
      householdProfile,
    };
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    await this.prisma.person.delete({ where: { id } });
    return { deleted: true };
  }

  async listRelations(tenantId: string, personId: string) {
    return this.personRelationService.listRelations(tenantId, personId);
  }

  async getIdentity(tenantId: string, personId: string) {
    return this.personRelationService.getIdentity(tenantId, personId);
  }

  async listRelationsTree(tenantId: string, personId: string, depth = 2) {
    return this.personRelationService.listRelationsTree(
      tenantId,
      personId,
      depth,
    );
  }

  async createRelation(
    tenantId: string,
    personId: string,
    input: CreatePersonRelationInput,
  ) {
    return this.personRelationService.createRelation(tenantId, personId, input);
  }

  async updateRelation(
    tenantId: string,
    personId: string,
    relationId: string,
    input: UpdatePersonRelationInput,
  ) {
    return this.personRelationService.updateRelation(
      tenantId,
      personId,
      relationId,
      input,
    );
  }

  async removeRelation(tenantId: string, personId: string, relationId: string) {
    return this.personRelationService.removeRelation(
      tenantId,
      personId,
      relationId,
    );
  }
}
