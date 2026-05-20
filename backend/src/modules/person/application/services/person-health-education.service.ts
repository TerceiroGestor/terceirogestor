import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { parseDateInput } from '../../../../core/utils/dates';
import { normalizeString } from '../../../../core/utils/strings';
import {
  mapEducation,
  mapHealthCondition,
  mapMedication,
} from '../mappers/person-response.mapper';
import { normalizeOptionalUrl } from '../../domain/normalizers/person-field.normalizer';
import { CreatePersonEducationDto } from '../../dto/create-person-education.dto';
import { CreatePersonHealthConditionDto } from '../../dto/create-person-health-condition.dto';
import { CreatePersonMedicationDto } from '../../dto/create-person-medication.dto';
import { UpdatePersonEducationDto } from '../../dto/update-person-education.dto';
import { UpdatePersonHealthConditionDto } from '../../dto/update-person-health-condition.dto';
import { UpdatePersonMedicationDto } from '../../dto/update-person-medication.dto';
import { PersonHealthEducationRepository } from '../../infrastructure/repositories/person-health-education.repository';
import { PersonRepository } from '../../infrastructure/repositories/person.repository';

@Injectable()
export class PersonHealthEducationService {
  constructor(
    private readonly personRepository: PersonRepository,
    private readonly personHealthEducationRepository: PersonHealthEducationRepository,
  ) {}

  async listHealthConditions(tenantId: string, personId: string) {
    await this.assertPersonExists(tenantId, personId);
    const conditions =
      await this.personHealthEducationRepository.listHealthConditions(
        tenantId,
        personId,
      );
    return conditions.map(mapHealthCondition);
  }

  async createHealthCondition(
    tenantId: string,
    personId: string,
    dto: CreatePersonHealthConditionDto,
  ) {
    await this.assertPersonExists(tenantId, personId);
    const type = normalizeString(dto.type);
    if (!type) {
      throw new BadRequestException('Condicao de saude invalida.');
    }

    const condition =
      await this.personHealthEducationRepository.createHealthCondition({
        tenantId,
        personId,
        type,
        description:
          dto.description !== undefined ? normalizeString(dto.description) : null,
        severity:
          dto.severity !== undefined ? normalizeString(dto.severity) : null,
        diagnosisDate: dto.diagnosisDate
          ? parseDateInput(dto.diagnosisDate)
          : null,
        documentUrl:
          dto.documentUrl !== undefined ? normalizeString(dto.documentUrl) : null,
        notes: dto.notes !== undefined ? normalizeString(dto.notes) : null,
      });

    return mapHealthCondition(condition);
  }

  async updateHealthCondition(
    tenantId: string,
    personId: string,
    conditionId: string,
    dto: UpdatePersonHealthConditionDto,
  ) {
    const condition = await this.personHealthEducationRepository.findHealthCondition(
      tenantId,
      personId,
      conditionId,
    );
    if (!condition) {
      throw new NotFoundException('Condicao de saude nao encontrada.');
    }

    const type =
      dto.type !== undefined
        ? (normalizeString(dto.type) ?? undefined)
        : undefined;
    if (dto.type !== undefined && type === undefined) {
      throw new BadRequestException('Condicao de saude invalida.');
    }

    const updated = await this.personHealthEducationRepository.updateHealthCondition(
      conditionId,
      {
        type,
        description:
          dto.description !== undefined
            ? normalizeString(dto.description)
            : undefined,
        severity:
          dto.severity !== undefined ? normalizeString(dto.severity) : undefined,
        diagnosisDate:
          dto.diagnosisDate !== undefined
            ? dto.diagnosisDate
              ? parseDateInput(dto.diagnosisDate)
              : null
            : undefined,
        documentUrl: normalizeOptionalUrl(dto.documentUrl),
        notes: dto.notes !== undefined ? normalizeString(dto.notes) : undefined,
      },
    );

    return mapHealthCondition(updated);
  }

  async removeHealthCondition(
    tenantId: string,
    personId: string,
    conditionId: string,
  ) {
    const condition = await this.personHealthEducationRepository.findHealthCondition(
      tenantId,
      personId,
      conditionId,
    );
    if (!condition) {
      throw new NotFoundException('Condicao de saude nao encontrada.');
    }

    await this.personHealthEducationRepository.deleteHealthCondition(conditionId);
    return { deleted: true };
  }

  async listMedications(tenantId: string, personId: string) {
    await this.assertPersonExists(tenantId, personId);
    const medications = await this.personHealthEducationRepository.listMedications(
      tenantId,
      personId,
    );
    return medications.map(mapMedication);
  }

  async createMedication(
    tenantId: string,
    personId: string,
    dto: CreatePersonMedicationDto,
  ) {
    await this.assertPersonExists(tenantId, personId);
    const medicationName = normalizeString(dto.medication);
    if (!medicationName) {
      throw new BadRequestException('Medicacao invalida.');
    }

    const medication = await this.personHealthEducationRepository.createMedication({
      tenantId,
      personId,
      reason: dto.reason !== undefined ? normalizeString(dto.reason) : null,
      medication: medicationName,
      dosage: dto.dosage !== undefined ? normalizeString(dto.dosage) : null,
      schedule:
        dto.schedule !== undefined ? normalizeString(dto.schedule) : null,
      startDate: dto.startDate ? parseDateInput(dto.startDate) : null,
      endDate: dto.endDate ? parseDateInput(dto.endDate) : null,
      prescribingDoctor:
        dto.prescribingDoctor !== undefined
          ? normalizeString(dto.prescribingDoctor)
          : null,
      permissionDocumentUrl:
        dto.permissionDocumentUrl !== undefined
          ? normalizeString(dto.permissionDocumentUrl)
          : null,
      documentUrl:
        dto.documentUrl !== undefined ? normalizeString(dto.documentUrl) : null,
      notes: dto.notes !== undefined ? normalizeString(dto.notes) : null,
    });

    return mapMedication(medication);
  }

  async updateMedication(
    tenantId: string,
    personId: string,
    medicationId: string,
    dto: UpdatePersonMedicationDto,
  ) {
    const medication = await this.personHealthEducationRepository.findMedication(
      tenantId,
      personId,
      medicationId,
    );
    if (!medication) {
      throw new NotFoundException('Medicacao nao encontrada.');
    }

    const medicationName =
      dto.medication !== undefined
        ? (normalizeString(dto.medication) ?? undefined)
        : undefined;
    if (dto.medication !== undefined && medicationName === undefined) {
      throw new BadRequestException('Medicacao invalida.');
    }

    const updated = await this.personHealthEducationRepository.updateMedication(
      medicationId,
      {
        reason:
          dto.reason !== undefined ? normalizeString(dto.reason) : undefined,
        medication: medicationName,
        dosage:
          dto.dosage !== undefined ? normalizeString(dto.dosage) : undefined,
        schedule:
          dto.schedule !== undefined
            ? normalizeString(dto.schedule)
            : undefined,
        startDate:
          dto.startDate !== undefined
            ? dto.startDate
              ? parseDateInput(dto.startDate)
              : null
            : undefined,
        endDate:
          dto.endDate !== undefined
            ? dto.endDate
              ? parseDateInput(dto.endDate)
              : null
            : undefined,
        prescribingDoctor:
          dto.prescribingDoctor !== undefined
            ? normalizeString(dto.prescribingDoctor)
            : undefined,
        permissionDocumentUrl: normalizeOptionalUrl(dto.permissionDocumentUrl),
        documentUrl: normalizeOptionalUrl(dto.documentUrl),
        notes: dto.notes !== undefined ? normalizeString(dto.notes) : undefined,
      },
    );

    return mapMedication(updated);
  }

  async removeMedication(
    tenantId: string,
    personId: string,
    medicationId: string,
  ) {
    const medication = await this.personHealthEducationRepository.findMedication(
      tenantId,
      personId,
      medicationId,
    );
    if (!medication) {
      throw new NotFoundException('Medicacao nao encontrada.');
    }

    await this.personHealthEducationRepository.deleteMedication(medicationId);
    return { deleted: true };
  }

  async listEducations(tenantId: string, personId: string) {
    await this.assertPersonExists(tenantId, personId);
    const educations = await this.personHealthEducationRepository.listEducations(
      tenantId,
      personId,
    );
    return educations.map(mapEducation);
  }

  async createEducation(
    tenantId: string,
    personId: string,
    dto: CreatePersonEducationDto,
  ) {
    await this.assertPersonExists(tenantId, personId);

    const level = normalizeString(dto.level) ?? dto.level?.trim();
    if (!level) {
      throw new BadRequestException('Escolaridade invalida.');
    }
    const isCurrent = dto.isCurrent ?? true;

    const created = await this.personHealthEducationRepository.createEducation({
      tenantId,
      personId,
      level,
      status: dto.status !== undefined ? normalizeString(dto.status) : null,
      institution:
        dto.institution !== undefined ? normalizeString(dto.institution) : null,
      grade: dto.grade !== undefined ? normalizeString(dto.grade) : null,
      schoolYear:
        dto.schoolYear !== undefined ? normalizeString(dto.schoolYear) : null,
      isCurrent,
      startDate: dto.startDate ? parseDateInput(dto.startDate) : null,
      endDate: dto.endDate ? parseDateInput(dto.endDate) : null,
      notes: dto.notes !== undefined ? normalizeString(dto.notes) : null,
    });

    return mapEducation(created);
  }

  async updateEducation(
    tenantId: string,
    personId: string,
    educationId: string,
    dto: UpdatePersonEducationDto,
  ) {
    const existing = await this.personHealthEducationRepository.findEducation(
      tenantId,
      personId,
      educationId,
    );
    if (!existing) {
      throw new NotFoundException('Escolaridade nao encontrada.');
    }

    const nextIsCurrent =
      dto.isCurrent !== undefined ? dto.isCurrent : existing.isCurrent;

    const level =
      dto.level !== undefined
        ? (normalizeString(dto.level) ?? undefined)
        : undefined;
    if (dto.level !== undefined && !level) {
      throw new BadRequestException('Escolaridade invalida.');
    }

    const updated = await this.personHealthEducationRepository.updateEducation(
      tenantId,
      personId,
      educationId,
      {
        level,
        status:
          dto.status !== undefined ? normalizeString(dto.status) : undefined,
        institution:
          dto.institution !== undefined
            ? normalizeString(dto.institution)
            : undefined,
        grade:
          dto.grade !== undefined ? normalizeString(dto.grade) : undefined,
        schoolYear:
          dto.schoolYear !== undefined
            ? normalizeString(dto.schoolYear)
            : undefined,
        isCurrent: dto.isCurrent !== undefined ? dto.isCurrent : undefined,
        startDate:
          dto.startDate !== undefined
            ? dto.startDate
              ? parseDateInput(dto.startDate)
              : null
            : undefined,
        endDate:
          dto.endDate !== undefined
            ? dto.endDate
              ? parseDateInput(dto.endDate)
              : null
            : undefined,
        notes:
          dto.notes !== undefined ? normalizeString(dto.notes) : undefined,
      },
      nextIsCurrent,
    );

    return mapEducation(updated);
  }

  async removeEducation(
    tenantId: string,
    personId: string,
    educationId: string,
  ) {
    const existing = await this.personHealthEducationRepository.findEducation(
      tenantId,
      personId,
      educationId,
    );
    if (!existing) {
      throw new NotFoundException('Escolaridade nao encontrada.');
    }

    await this.personHealthEducationRepository.deleteEducation(educationId);
    return { deleted: true };
  }

  private async assertPersonExists(tenantId: string, personId: string) {
    const person = await this.personRepository.existsById(tenantId, personId);
    if (!person) {
      throw new NotFoundException('Person not found');
    }
  }
}