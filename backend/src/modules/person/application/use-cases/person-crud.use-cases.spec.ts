import { NotFoundException } from '@nestjs/common';
import { CreatePersonUseCase } from './create-person.use-case';
import { GetPersonByIdUseCase } from './get-person-by-id.use-case';
import { ListPersonUseCase } from './list-person.use-case';
import { UpdatePersonUseCase } from './update-person.use-case';
import { PersonRepository } from '../../infrastructure/repositories/person.repository';

describe('Person CRUD use cases', () => {
  const tenantId = 'tenant-1';
  const personId = 'person-1';
  const repository = {
    create: jest.fn(),
    findManyWithHealthCounts: jest.fn(),
    count: jest.fn(),
    findDetailById: jest.fn(),
    existsById: jest.fn(),
    update: jest.fn(),
  } as unknown as jest.Mocked<PersonRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a person through the repository', async () => {
    repository.create.mockResolvedValue({
      id: personId,
      fullName: 'Maria',
      avatarUrl: null,
      birthDate: null,
      sex: null,
      gender: null,
      raceColor: null,
      status: 'Ativo',
      personType: 'Atendido',
      socialName: null,
      maritalStatus: null,
      nationality: null,
      email: null,
      phone: null,
      document: null,
      rg: null,
      nis: null,
      departureReason: null,
      notes: null,
      tags: null,
      profileSummary: null,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { healthConditions: 0, medications: 0 },
      comments: [],
      attachments: [],
    } as never);

    const useCase = new CreatePersonUseCase(repository);
    const result = await useCase.execute(tenantId, { fullName: 'Maria' });

    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(personId);
  });

  it('lists people with pagination metadata', async () => {
    repository.findManyWithHealthCounts.mockResolvedValue([] as never);
    repository.count.mockResolvedValue(0 as never);

    const useCase = new ListPersonUseCase(repository);
    const result = await useCase.execute(tenantId, { page: 1, limit: 10 });

    expect(repository.findManyWithHealthCounts).toHaveBeenCalledTimes(1);
    expect(repository.count).toHaveBeenCalledTimes(1);
    expect(result.pagination.total).toBe(0);
  });

  it('returns person detail when found', async () => {
    repository.findDetailById.mockResolvedValue({
      id: personId,
      fullName: 'Maria',
      avatarUrl: null,
      birthDate: null,
      sex: null,
      gender: null,
      raceColor: null,
      status: 'Ativo',
      personType: 'Atendido',
      socialName: null,
      maritalStatus: null,
      nationality: null,
      email: null,
      phone: null,
      document: null,
      rg: null,
      nis: null,
      departureReason: null,
      notes: null,
      tags: null,
      profileSummary: null,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { healthConditions: 0, medications: 0 },
      comments: [],
      attachments: [],
    } as never);

    const useCase = new GetPersonByIdUseCase(repository);
    const result = await useCase.execute(tenantId, personId);

    expect(result.id).toBe(personId);
  });

  it('throws when updating an unknown person', async () => {
    repository.existsById.mockResolvedValue(null as never);

    const useCase = new UpdatePersonUseCase(repository);

    await expect(useCase.execute(tenantId, personId, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});