import { NotFoundException } from '@nestjs/common';
import { PersonRelationService } from './person-relation.service';
import { PersonRelationRepository } from '../../infrastructure/repositories/person-relation.repository';
import { PersonRepository } from '../../infrastructure/repositories/person.repository';

describe('PersonRelationService', () => {
  const personRepository = {
    existsById: jest.fn(),
  } as unknown as jest.Mocked<PersonRepository>;
  const relationRepository = {
    findPerson: jest.fn(),
    findHouseholdMemberWithHousehold: jest.fn(),
    findHouseholdMembersByHousehold: jest.fn(),
    findRelationsByPerson: jest.fn(),
    findRelatedHouseholdMembers: jest.fn(),
    findIdentityPerson: jest.fn(),
    findActiveHouseholdMember: jest.fn(),
    findActiveHouseholdMembersWithCounts: jest.fn(),
    findNonLivingRelationsWithCounts: jest.fn(),
    findGraphRelationsForNodeIds: jest.fn(),
    findGraphPeople: jest.fn(),
    findGraphEdges: jest.fn(),
    findRelation: jest.fn(),
    createOrReplaceRelation: jest.fn(),
    updateRelation: jest.fn(),
    deleteRelation: jest.fn(),
  } as unknown as jest.Mocked<PersonRelationRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    personRepository.existsById.mockResolvedValue({ id: 'person-1' } as never);
  });

  it('throws when identity target does not exist', async () => {
    relationRepository.findIdentityPerson.mockResolvedValue(null as never);
    const service = new PersonRelationService(personRepository, relationRepository);

    await expect(
      service.getIdentity('tenant-1', 'person-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('prevents self relation creation', async () => {
    const service = new PersonRelationService(personRepository, relationRepository);

    await expect(
      service.createRelation('tenant-1', 'person-1', {
        relatedPersonId: 'person-1',
        type: 'Mãe',
      }),
    ).rejects.toThrow('A pessoa nao pode se relacionar com ela mesma.');
  });
});