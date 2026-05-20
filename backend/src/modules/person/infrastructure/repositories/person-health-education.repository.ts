import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../generated/prisma';
import { PrismaService } from '../../../../core/prisma/prisma.service';

@Injectable()
export class PersonHealthEducationRepository {
  constructor(private readonly prisma: PrismaService) {}

  listHealthConditions(tenantId: string, personId: string) {
    return this.prisma.personHealthCondition.findMany({
      where: { tenantId, personId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findHealthCondition(tenantId: string, personId: string, conditionId: string) {
    return this.prisma.personHealthCondition.findFirst({
      where: { id: conditionId, tenantId, personId },
    });
  }

  createHealthCondition(data: Prisma.PersonHealthConditionUncheckedCreateInput) {
    return this.prisma.personHealthCondition.create({ data });
  }

  updateHealthCondition(
    conditionId: string,
    data: Prisma.PersonHealthConditionUpdateInput,
  ) {
    return this.prisma.personHealthCondition.update({
      where: { id: conditionId },
      data,
    });
  }

  deleteHealthCondition(conditionId: string) {
    return this.prisma.personHealthCondition.delete({ where: { id: conditionId } });
  }

  listMedications(tenantId: string, personId: string) {
    return this.prisma.personMedication.findMany({
      where: { tenantId, personId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findMedication(tenantId: string, personId: string, medicationId: string) {
    return this.prisma.personMedication.findFirst({
      where: { id: medicationId, tenantId, personId },
    });
  }

  createMedication(data: Prisma.PersonMedicationUncheckedCreateInput) {
    return this.prisma.personMedication.create({ data });
  }

  updateMedication(
    medicationId: string,
    data: Prisma.PersonMedicationUpdateInput,
  ) {
    return this.prisma.personMedication.update({
      where: { id: medicationId },
      data,
    });
  }

  deleteMedication(medicationId: string) {
    return this.prisma.personMedication.delete({ where: { id: medicationId } });
  }

  listEducations(tenantId: string, personId: string) {
    return this.prisma.personEducation.findMany({
      where: { tenantId, personId },
      orderBy: [
        { isCurrent: 'desc' },
        { startDate: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  findEducation(tenantId: string, personId: string, educationId: string) {
    return this.prisma.personEducation.findFirst({
      where: { id: educationId, tenantId, personId },
    });
  }

  createEducation(data: {
    tenantId: string;
    personId: string;
    level: string;
    status: string | null;
    institution: string | null;
    grade: string | null;
    schoolYear: string | null;
    isCurrent: boolean;
    startDate: Date | null;
    endDate: Date | null;
    notes: string | null;
  }) {
    return this.prisma.$transaction(async (tx) => {
      if (data.isCurrent) {
        await tx.personEducation.updateMany({
          where: { tenantId: data.tenantId, personId: data.personId, isCurrent: true },
          data: { isCurrent: false },
        });
      }

      return tx.personEducation.create({
        data: {
          tenantId: data.tenantId,
          personId: data.personId,
          level: data.level,
          status: data.status,
          institution: data.institution,
          grade: data.grade,
          schoolYear: data.schoolYear,
          isCurrent: data.isCurrent,
          startDate: data.startDate,
          endDate: data.endDate,
          notes: data.notes,
        },
      });
    });
  }

  updateEducation(
    tenantId: string,
    personId: string,
    educationId: string,
    data: Prisma.PersonEducationUpdateInput,
    nextIsCurrent: boolean,
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (nextIsCurrent) {
        await tx.personEducation.updateMany({
          where: {
            tenantId,
            personId,
            isCurrent: true,
            NOT: { id: educationId },
          },
          data: { isCurrent: false },
        });
      }

      return tx.personEducation.update({
        where: { id: educationId },
        data,
      });
    });
  }

  deleteEducation(educationId: string) {
    return this.prisma.personEducation.delete({ where: { id: educationId } });
  }
}