import { PersonAssetHouseholdService } from './application/services/person-asset-household.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CepService } from '../../core/cep/cep.service';
import { PersonFinanceService } from './application/services/person-finance.service';
import { PersonBenefitDetentionService } from './application/services/person-benefit-detention.service';
import { PersonHealthEducationService } from './application/services/person-health-education.service';
import { PersonRecordMetadataService } from './application/services/person-record-metadata.service';
import { PersonRelationService } from './application/services/person-relation.service';
import { CreatePersonUseCase } from './application/use-cases/create-person.use-case';
import { CreatePersonContactUseCase } from './application/use-cases/create-person-contact.use-case';
import { GetPersonByIdUseCase } from './application/use-cases/get-person-by-id.use-case';
import { GetPersonSensitiveDocumentsUseCase } from './application/use-cases/get-person-sensitive-documents.use-case';
import { ListPersonUseCase } from './application/use-cases/list-person.use-case';
import { ListPersonContactsUseCase } from './application/use-cases/list-person-contacts.use-case';
import { PersonService } from './person.service';
import { RemovePersonContactUseCase } from './application/use-cases/remove-person-contact.use-case';
import { UpdatePersonContactUseCase } from './application/use-cases/update-person-contact.use-case';
import { UpdatePersonUseCase } from './application/use-cases/update-person.use-case';
import { UpsertPersonSensitiveDocumentsUseCase } from './application/use-cases/upsert-person-sensitive-documents.use-case';

describe('PersonService', () => {
  let service: PersonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonService,
        { provide: PrismaService, useValue: {} as PrismaService },
        { provide: CepService, useValue: {} as CepService },
        { provide: CreatePersonUseCase, useValue: {} as CreatePersonUseCase },
        {
          provide: CreatePersonContactUseCase,
          useValue: {} as CreatePersonContactUseCase,
        },
        { provide: ListPersonUseCase, useValue: {} as ListPersonUseCase },
        {
          provide: ListPersonContactsUseCase,
          useValue: {} as ListPersonContactsUseCase,
        },
        {
          provide: GetPersonByIdUseCase,
          useValue: {} as GetPersonByIdUseCase,
        },
        {
          provide: GetPersonSensitiveDocumentsUseCase,
          useValue: {} as GetPersonSensitiveDocumentsUseCase,
        },
        {
          provide: RemovePersonContactUseCase,
          useValue: {} as RemovePersonContactUseCase,
        },
        {
          provide: UpdatePersonContactUseCase,
          useValue: {} as UpdatePersonContactUseCase,
        },
        { provide: UpdatePersonUseCase, useValue: {} as UpdatePersonUseCase },
        {
          provide: UpsertPersonSensitiveDocumentsUseCase,
          useValue: {} as UpsertPersonSensitiveDocumentsUseCase,
        },
        {
          provide: PersonFinanceService,
          useValue: {} as PersonFinanceService,
        },
        {
          provide: PersonAssetHouseholdService,
          useValue: {} as PersonAssetHouseholdService,
        },
        {
          provide: PersonBenefitDetentionService,
          useValue: {} as PersonBenefitDetentionService,
        },
        {
          provide: PersonHealthEducationService,
          useValue: {} as PersonHealthEducationService,
        },
        {
          provide: PersonRecordMetadataService,
          useValue: {} as PersonRecordMetadataService,
        },
        {
          provide: PersonRelationService,
          useValue: {} as PersonRelationService,
        },
      ],
    }).compile();

    service = module.get<PersonService>(PersonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
