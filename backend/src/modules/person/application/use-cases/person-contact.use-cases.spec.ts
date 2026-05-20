import { NotFoundException } from '@nestjs/common';
import { CreatePersonContactUseCase } from './create-person-contact.use-case';
import { ListPersonContactsUseCase } from './list-person-contacts.use-case';
import { RemovePersonContactUseCase } from './remove-person-contact.use-case';
import { UpdatePersonContactUseCase } from './update-person-contact.use-case';
import { PersonContactRepository } from '../../infrastructure/repositories/person-contact.repository';
import { PersonRepository } from '../../infrastructure/repositories/person.repository';

describe('Person contact use cases', () => {
  const personRepository = {
    existsById: jest.fn(),
  } as unknown as jest.Mocked<PersonRepository>;
  const contactRepository = {
    findManyByPersonId: jest.fn(),
    findById: jest.fn(),
    createWithPrimaryHandling: jest.fn(),
    updateWithPrimaryHandling: jest.fn(),
    deleteById: jest.fn(),
  } as unknown as jest.Mocked<PersonContactRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    personRepository.existsById.mockResolvedValue({ id: 'person-1' } as never);
  });

  it('lists contacts when person exists', async () => {
    contactRepository.findManyByPersonId.mockResolvedValue([] as never);
    const useCase = new ListPersonContactsUseCase(
      personRepository,
      contactRepository,
    );

    const result = await useCase.execute('tenant-1', 'person-1');

    expect(result).toEqual([]);
  });

  it('creates contact through repository', async () => {
    contactRepository.createWithPrimaryHandling.mockResolvedValue({
      id: 'contact-1',
      tenantId: 'tenant-1',
      personId: 'person-1',
      type: 'EMAIL',
      role: 'SELF',
      value: 'mail@example.com',
      label: null,
      name: null,
      relationship: null,
      isPrimary: true,
      isWhatsapp: false,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    const useCase = new CreatePersonContactUseCase(
      personRepository,
      contactRepository,
    );

    const result = await useCase.execute('tenant-1', 'person-1', {
      type: 'EMAIL',
      value: 'mail@example.com',
    });

    expect(result.id).toBe('contact-1');
  });

  it('throws when updating unknown contact', async () => {
    contactRepository.findById.mockResolvedValue(null as never);
    const useCase = new UpdatePersonContactUseCase(
      personRepository,
      contactRepository,
    );

    await expect(
      useCase.execute('tenant-1', 'person-1', 'contact-1', {}),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes contact when found', async () => {
    contactRepository.findById.mockResolvedValue({ id: 'contact-1' } as never);
    contactRepository.deleteById.mockResolvedValue({} as never);
    const useCase = new RemovePersonContactUseCase(
      personRepository,
      contactRepository,
    );

    await expect(
      useCase.execute('tenant-1', 'person-1', 'contact-1'),
    ).resolves.toEqual({ deleted: true });
  });
});