import { Injectable } from '@nestjs/common';
import { normalizeString } from '../../../../core/utils/strings';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import {
  isGenealogyRelation,
  requiresPersonContextForInverseType,
  resolveInverseType,
} from '../../domain/policies/person-relation.policy';
import type {
  CreatePersonRelationInput,
  UpdatePersonRelationInput,
} from '../../application/types/person-relation.input';

@Injectable()
export class PersonRelationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPerson(tenantId: string, personId: string) {
    return this.prisma.person.findFirst({
      where: { id: personId, tenantId },
    });
  }

  findHouseholdMemberWithHousehold(tenantId: string, personId: string) {
    return this.prisma.householdMember.findFirst({
      where: { tenantId, personId },
      include: { household: true },
    });
  }

  findHouseholdMembersByHousehold(tenantId: string, householdId: string) {
    return this.prisma.householdMember.findMany({
      where: { tenantId, householdId },
      include: { person: true },
    });
  }

  findRelationsByPerson(tenantId: string, personId: string) {
    return this.prisma.personRelation.findMany({
      where: { tenantId, personId },
      include: { relatedPerson: true },
    });
  }

  findRelatedHouseholdMembers(tenantId: string, relatedIds: string[]) {
    return this.prisma.householdMember.findMany({
      where: {
        tenantId,
        personId: { in: relatedIds },
        endDate: null,
      },
      include: { household: true, person: true },
    });
  }

  findIdentityPerson(tenantId: string, personId: string) {
    return this.prisma.person.findFirst({
      where: { tenantId, id: personId },
      select: {
        id: true,
        fullName: true,
        socialName: true,
        birthDate: true,
        avatarUrl: true,
        _count: {
          select: {
            healthConditions: true,
            medications: true,
          },
        },
      },
    });
  }

  findActiveHouseholdMember(tenantId: string, personId: string) {
    return this.prisma.householdMember.findFirst({
      where: { tenantId, personId, endDate: null },
      select: { householdId: true },
    });
  }

  findActiveHouseholdMembersWithCounts(tenantId: string, householdId: string) {
    return this.prisma.householdMember.findMany({
      where: {
        tenantId,
        householdId,
        endDate: null,
      },
      select: {
        role: true,
        person: {
          select: {
            id: true,
            fullName: true,
            socialName: true,
            birthDate: true,
            avatarUrl: true,
            _count: {
              select: { healthConditions: true, medications: true },
            },
          },
        },
      },
    });
  }

  findNonLivingRelationsWithCounts(tenantId: string, personId: string) {
    return this.prisma.personRelation.findMany({
      where: { tenantId, personId, livesTogether: false },
      select: {
        relatedPersonId: true,
        type: true,
        relatedPerson: {
          select: {
            id: true,
            fullName: true,
            socialName: true,
            birthDate: true,
            avatarUrl: true,
            _count: { select: { healthConditions: true, medications: true } },
          },
        },
      },
    });
  }

  findGraphRelationsForNodeIds(tenantId: string, ids: string[]) {
    return this.prisma.personRelation.findMany({
      where: {
        tenantId,
        OR: [{ personId: { in: ids } }, { relatedPersonId: { in: ids } }],
      },
      select: { personId: true, relatedPersonId: true, type: true },
    });
  }

  findGraphPeople(tenantId: string, nodeIds: string[]) {
    return this.prisma.person.findMany({
      where: { tenantId, id: { in: nodeIds } },
      include: {
        _count: {
          select: { healthConditions: true, medications: true },
        },
      },
    });
  }

  findGraphEdges(tenantId: string, nodeIds: string[]) {
    return this.prisma.personRelation.findMany({
      where: {
        tenantId,
        personId: { in: nodeIds },
        relatedPersonId: { in: nodeIds },
      },
      select: { id: true, personId: true, relatedPersonId: true, type: true },
    });
  }

  findRelation(tenantId: string, personId: string, relationId: string) {
    return this.prisma.personRelation.findFirst({
      where: { tenantId, id: relationId, personId },
    });
  }

  async createOrReplaceRelation(
    tenantId: string,
    personId: string,
    input: CreatePersonRelationInput,
    normalizedType: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const livesTogether = input.livesTogether ?? false;
      const isLegalGuardian = input.isLegalGuardian ?? false;
      const existing = await tx.personRelation.findFirst({
        where: {
          tenantId,
          personId,
          relatedPersonId: input.relatedPersonId,
        },
      });

      const created = existing
        ? await tx.personRelation.update({
            where: { id: existing.id },
            data: {
              type: normalizedType,
              livesTogether,
              isLegalGuardian,
              notes: normalizeString(input.notes),
            },
          })
        : await tx.personRelation.create({
            data: {
              tenantId,
              personId,
              relatedPersonId: input.relatedPersonId,
              type: normalizedType,
              livesTogether,
              isLegalGuardian,
              notes: normalizeString(input.notes),
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
          input.relatedPersonId,
          input,
        );
      } else {
        await this.removeHouseholdMember(
          tx,
          tenantId,
          personId,
          input.relatedPersonId,
        );
      }

      return created;
    });
  }

  async updateRelation(
    tenantId: string,
    personId: string,
    relationId: string,
    input: UpdatePersonRelationInput,
    normalizedType?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const relation = await tx.personRelation.findFirst({
        where: { tenantId, id: relationId, personId },
      });
      if (!relation) {
        return null;
      }

      const nextType = normalizedType ?? relation.type;
      const nextLivesTogether =
        input.livesTogether !== undefined
          ? input.livesTogether
          : relation.livesTogether;
      const nextLegalGuardian =
        input.isLegalGuardian !== undefined
          ? input.isLegalGuardian
          : relation.isLegalGuardian;

      if (normalizedType !== undefined) {
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
          notes:
            input.notes !== undefined
              ? normalizeString(input.notes)
              : relation.notes,
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
          input,
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
  }

  async deleteRelation(tenantId: string, personId: string, relationId: string) {
    return this.prisma.$transaction(async (tx) => {
      const relation = await tx.personRelation.findFirst({
        where: { tenantId, id: relationId, personId },
      });
      if (!relation) {
        return null;
      }

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

      return relation;
    });
  }

  private async ensureHouseholdForPerson(
    tx: PrismaService,
    tenantId: string,
    personId: string,
  ): Promise<string> {
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
        isHouseholdHead: true,
      },
    });
    return household.id;
  }

  private async ensureHouseholdMember(
    tx: PrismaService,
    tenantId: string,
    householdId: string,
    personId: string,
    input: Pick<
      CreatePersonRelationInput & UpdatePersonRelationInput,
      | 'householdRole'
      | 'isIncomeContributor'
      | 'isProvider'
      | 'isDependent'
      | 'isLegalGuardian'
      | 'isHouseholdHead'
    >,
  ) {
    await tx.householdMember.upsert({
      where: { householdId_personId: { householdId, personId } },
      create: {
        tenantId,
        householdId,
        personId,
        role: normalizeString(input.householdRole),
        isIncomeContributor: input.isIncomeContributor ?? false,
        isProvider: input.isProvider ?? false,
        isDependent: input.isDependent ?? false,
        isLegalGuardian: input.isLegalGuardian ?? false,
        isHouseholdHead: input.isHouseholdHead ?? false,
      },
      update: {
        role:
          input.householdRole !== undefined
            ? normalizeString(input.householdRole)
            : undefined,
        isIncomeContributor:
          input.isIncomeContributor !== undefined
            ? input.isIncomeContributor
            : undefined,
        isProvider:
          input.isProvider !== undefined ? input.isProvider : undefined,
        isDependent:
          input.isDependent !== undefined ? input.isDependent : undefined,
        isLegalGuardian:
          input.isLegalGuardian !== undefined
            ? input.isLegalGuardian
            : undefined,
        isHouseholdHead:
          input.isHouseholdHead !== undefined
            ? input.isHouseholdHead
            : undefined,
      },
    });
  }

  private async removeHouseholdMember(
    tx: PrismaService,
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
    tx: PrismaService,
    tenantId: string,
    relation: {
      relatedPersonId: string;
      personId: string;
      type: string;
      livesTogether?: boolean;
      isLegalGuardian?: boolean;
      notes?: string | null;
    },
  ) {
    const personContext = requiresPersonContextForInverseType(relation.type)
      ? await tx.person.findUnique({
          where: { id: relation.personId },
          select: { sex: true, gender: true },
        })
      : null;
    const inverseType = resolveInverseType(relation.type, personContext);
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