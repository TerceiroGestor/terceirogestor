import { PiiCryptoService } from '../../../../core/pii/pii-crypto.service';
import { RequestContextService } from '../../../../core/request-context/request-context.service';
import { GetPersonSensitiveDocumentsUseCase } from './get-person-sensitive-documents.use-case';
import { UpsertPersonSensitiveDocumentsUseCase } from './upsert-person-sensitive-documents.use-case';
import { PersonRepository } from '../../infrastructure/repositories/person.repository';
import { PersonSensitiveDocumentsRepository } from '../../infrastructure/repositories/person-sensitive-documents.repository';

describe('Person sensitive documents use cases', () => {
  const personRepository = {
    existsById: jest.fn(),
  } as unknown as jest.Mocked<PersonRepository>;
  const repository = {
    findByPersonId: jest.fn(),
    upsertEncryptedDocument: jest.fn(),
    logAccess: jest.fn(),
  } as unknown as jest.Mocked<PersonSensitiveDocumentsRepository>;
  const pii = {
    decryptForTenant: jest.fn(),
    encryptForTenant: jest.fn(),
  } as unknown as jest.Mocked<PiiCryptoService>;
  const requestContext = {
    get: jest.fn(),
  } as unknown as jest.Mocked<RequestContextService>;

  beforeEach(() => {
    jest.clearAllMocks();
    personRepository.existsById.mockResolvedValue({ id: 'person-1' } as never);
    requestContext.get.mockReturnValue({
      userId: 'user-1',
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    } as never);
    repository.logAccess.mockResolvedValue({} as never);
  });

  it('returns null when there is no encrypted record', async () => {
    repository.findByPersonId.mockResolvedValue(null as never);
    const useCase = new GetPersonSensitiveDocumentsUseCase(
      personRepository,
      repository,
      pii,
      requestContext,
    );

    await expect(useCase.execute('tenant-1', 'person-1')).resolves.toBeNull();
  });

  it('upserts encrypted sensitive documents', async () => {
    repository.findByPersonId.mockResolvedValue(null as never);
    pii.encryptForTenant.mockReturnValue({
      dataEnc: 'enc',
      iv: 'iv',
      tag: 'tag',
    } as never);
    repository.upsertEncryptedDocument.mockResolvedValue({
      dataEnc: 'enc',
      iv: 'iv',
      tag: 'tag',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    pii.decryptForTenant.mockReturnValue({
      cpf: '12345678901',
      rg: null,
      nis: null,
      cns: null,
    } as never);

    const useCase = new UpsertPersonSensitiveDocumentsUseCase(
      personRepository,
      repository,
      pii,
      requestContext,
    );

    const result = await useCase.execute('tenant-1', 'person-1', {
      cpf: '12345678909',
    });

    expect(repository.upsertEncryptedDocument).toHaveBeenCalledTimes(1);
    expect(result.cpf).toBe('12345678901');
  });
});