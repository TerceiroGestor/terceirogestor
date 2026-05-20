import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { mapPersonSummary } from '../mappers/person-response.mapper';
import { normalizeString } from '../../../../core/utils/strings';
import { isGenealogyRelation } from '../../domain/policies/person-relation.policy';
import type {
  CreatePersonRelationInput,
  UpdatePersonRelationInput,
} from '../types/person-relation.input';
import { PersonRelationRepository } from '../../infrastructure/repositories/person-relation.repository';
import { PersonRepository } from '../../infrastructure/repositories/person.repository';

@Injectable()
export class PersonRelationService {
  constructor(
    private readonly personRepository: PersonRepository,
    private readonly personRelationRepository: PersonRelationRepository,
  ) {}

  async listRelations(tenantId: string, personId: string) {
    await this.assertPersonExists(tenantId, personId);

    const householdMember =
      await this.personRelationRepository.findHouseholdMemberWithHousehold(
        tenantId,
        personId,
      );
    const householdMembers = householdMember?.householdId
      ? await this.personRelationRepository.findHouseholdMembersByHousehold(
          tenantId,
          householdMember.householdId,
        )
      : [];

    const relations = await this.personRelationRepository.findRelationsByPerson(
      tenantId,
      personId,
    );

    const relationMap = new Map(
      relations.map((relation) => [relation.relatedPersonId, relation]),
    );
    const relatedIds = relations.map((relation) => relation.relatedPersonId);
    const relatedHouseholdMembers = relatedIds.length
      ? await this.personRelationRepository.findRelatedHouseholdMembers(
          tenantId,
          relatedIds,
        )
      : [];

    return {
      household: householdMember?.household
        ? {
            id: householdMember.household.id,
            name: householdMember.household.name,
          }
        : null,
      householdMembers: householdMembers.map((member) => ({
        id: member.id,
        personId: member.personId,
        role: member.role,
        isLegalGuardian: member.isLegalGuardian,
        isHouseholdHead: member.isHouseholdHead,
        isIncomeContributor: member.isIncomeContributor,
        isProvider: member.isProvider,
        isDependent: member.isDependent,
        notes: member.notes,
        startDate: member.startDate,
        endDate: member.endDate,
        person: mapPersonSummary(member.person),
      })),
      relations: relations.map((relation) => ({
        id: relation.id,
        personId: relation.personId,
        relatedPersonId: relation.relatedPersonId,
        type: relation.type,
        livesTogether: relation.livesTogether,
        isLegalGuardian: relation.isLegalGuardian,
        notes: relation.notes,
        createdAt: relation.createdAt,
        updatedAt: relation.updatedAt,
        relatedPerson: mapPersonSummary(relation.relatedPerson),
      })),
      relatedHouseholds: relatedHouseholdMembers.map((member) => {
        const relation = relationMap.get(member.personId);
        return {
          householdId: member.householdId,
          householdName: member.household?.name ?? null,
          personId: member.personId,
          personName: member.person.fullName,
          relationType: relation?.type ?? null,
          livesTogether: relation?.livesTogether ?? false,
        };
      }),
    };
  }

  async getIdentity(tenantId: string, personId: string) {
    const person = await this.personRelationRepository.findIdentityPerson(
      tenantId,
      personId,
    );
    if (!person) {
      throw new NotFoundException('Pessoa nao encontrada.');
    }

    const householdMember =
      await this.personRelationRepository.findActiveHouseholdMember(
        tenantId,
        personId,
      );
    const householdMembers = householdMember?.householdId
      ? await this.personRelationRepository.findActiveHouseholdMembersWithCounts(
          tenantId,
          householdMember.householdId,
        )
      : [];

    const livingTogether = householdMembers
      .filter((member) => member.person.id !== personId)
      .map((member) => ({
        id: member.person.id,
        fullName: member.person.fullName,
        socialName: member.person.socialName ?? null,
        birthDate: member.person.birthDate ?? null,
        avatarUrl: member.person.avatarUrl ?? null,
        role: member.role ?? 'Morador',
        hasHealthCondition: member.person._count.healthConditions > 0,
        hasMedication: member.person._count.medications > 0,
      }));

    const livingIds = new Set(livingTogether.map((member) => member.id));
    const relations =
      await this.personRelationRepository.findNonLivingRelationsWithCounts(
        tenantId,
        personId,
      );
    const notLivingTogether = relations
      .filter((relation) => !livingIds.has(relation.relatedPersonId))
      .map((relation) => ({
        id: relation.relatedPerson.id,
        fullName: relation.relatedPerson.fullName,
        socialName: relation.relatedPerson.socialName ?? null,
        birthDate: relation.relatedPerson.birthDate ?? null,
        avatarUrl: relation.relatedPerson.avatarUrl ?? null,
        role: relation.type,
        hasHealthCondition: relation.relatedPerson._count.healthConditions > 0,
        hasMedication: relation.relatedPerson._count.medications > 0,
      }));

    return {
      person: {
        id: person.id,
        fullName: person.fullName,
        socialName: person.socialName ?? null,
        birthDate: person.birthDate ?? null,
        avatarUrl: person.avatarUrl ?? null,
        hasHealthCondition: person._count.healthConditions > 0,
        hasMedication: person._count.medications > 0,
      },
      family: {
        livingTogether,
        notLivingTogether,
      },
    };
  }

  async listRelationsTree(tenantId: string, personId: string, depth = 2) {
    const root = await this.personRelationRepository.findPerson(tenantId, personId);
    if (!root) {
      throw new NotFoundException('Pessoa nao encontrada.');
    }

    const maxDepth = Math.max(1, Math.min(Number(depth) || 2, 4));
    const maxNodes = 200;
    const depthMap = new Map<string, number>([[personId, 0]]);
    const visited = new Set<string>([personId]);
    let frontier = new Set<string>([personId]);

    for (let level = 0; level < maxDepth; level += 1) {
      if (!frontier.size) break;
      const ids = Array.from(frontier);
      const relations =
        await this.personRelationRepository.findGraphRelationsForNodeIds(
          tenantId,
          ids,
        );
      const nextFrontier = new Set<string>();
      for (const relation of relations) {
        if (!isGenealogyRelation(relation.type)) continue;
        const fromFrontier = frontier.has(relation.personId);
        const toFrontier = frontier.has(relation.relatedPersonId);
        if (!fromFrontier && !toFrontier) continue;
        const neighborId = fromFrontier
          ? relation.relatedPersonId
          : relation.personId;
        if (visited.has(neighborId)) continue;
        const nextDepth = level + 1;
        if (nextDepth > maxDepth) continue;
        visited.add(neighborId);
        depthMap.set(neighborId, nextDepth);
        nextFrontier.add(neighborId);
        if (visited.size >= maxNodes) break;
      }
      frontier = nextFrontier;
      if (visited.size >= maxNodes) break;
    }

    const nodeIds = Array.from(depthMap.keys());
    const people = await this.personRelationRepository.findGraphPeople(
      tenantId,
      nodeIds,
    );
    const edges = await this.personRelationRepository.findGraphEdges(
      tenantId,
      nodeIds,
    );

    return {
      rootId: personId,
      depth: maxDepth,
      truncated: visited.size >= maxNodes,
      nodes: people.map((person) => ({
        id: person.id,
        fullName: person.fullName,
        socialName: person.socialName,
        birthDate: person.birthDate,
        avatarUrl: person.avatarUrl,
        sex: person.sex,
        gender: person.gender,
        raceColor: person.raceColor,
        status: person.status,
        personType: person.personType,
        hasHealthCondition: person._count.healthConditions > 0,
        hasMedication: person._count.medications > 0,
        depth: depthMap.get(person.id) ?? 0,
      })),
      edges: edges
        .filter((relation) => isGenealogyRelation(relation.type))
        .map((relation) => ({
          id: relation.id,
          fromId: relation.personId,
          toId: relation.relatedPersonId,
          type: relation.type,
        })),
    };
  }

  async createRelation(
    tenantId: string,
    personId: string,
    input: CreatePersonRelationInput,
  ) {
    if (personId === input.relatedPersonId) {
      throw new BadRequestException(
        'A pessoa nao pode se relacionar com ela mesma.',
      );
    }

    await this.assertPersonExists(tenantId, personId);
    await this.assertPersonExists(tenantId, input.relatedPersonId);

    const type = normalizeString(input.type);
    if (!type) {
      throw new BadRequestException('Tipo de relacionamento invalido.');
    }

    return this.personRelationRepository.createOrReplaceRelation(
      tenantId,
      personId,
      input,
      type,
    );
  }

  async updateRelation(
    tenantId: string,
    personId: string,
    relationId: string,
    input: UpdatePersonRelationInput,
  ) {
    const relation = await this.personRelationRepository.findRelation(
      tenantId,
      personId,
      relationId,
    );
    if (!relation) {
      throw new NotFoundException('Relacionamento nao encontrado.');
    }

    const nextTypeNormalized =
      input.type !== undefined ? normalizeString(input.type) : undefined;
    if (input.type !== undefined && !nextTypeNormalized) {
      throw new BadRequestException('Tipo de relacionamento invalido.');
    }

    const updated = await this.personRelationRepository.updateRelation(
      tenantId,
      personId,
      relationId,
      input,
      nextTypeNormalized,
    );

    if (!updated) {
      throw new NotFoundException('Relacionamento nao encontrado.');
    }

    return updated;
  }

  async removeRelation(tenantId: string, personId: string, relationId: string) {
    const deleted = await this.personRelationRepository.deleteRelation(
      tenantId,
      personId,
      relationId,
    );
    if (!deleted) {
      throw new NotFoundException('Relacionamento nao encontrado.');
    }

    return { deleted: true };
  }

  private async assertPersonExists(tenantId: string, personId: string) {
    const person = await this.personRepository.existsById(tenantId, personId);
    if (!person) {
      throw new NotFoundException('Person not found');
    }
  }
}