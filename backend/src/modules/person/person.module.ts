import { PersonAssetHouseholdService } from './application/services/person-asset-household.service';
import { PersonAssetHouseholdRepository } from './infrastructure/repositories/person-asset-household.repository';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { CepModule } from '../../core/cep/cep.module';
import { PiiModule } from '../../core/pii/pii.module';
import { RequestContextModule } from '../../core/request-context/request-context.module';
import { PersonController } from './person.controller';
import { PersonService } from './person.service';
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
import { RemovePersonContactUseCase } from './application/use-cases/remove-person-contact.use-case';
import { UpdatePersonContactUseCase } from './application/use-cases/update-person-contact.use-case';
import { UpdatePersonUseCase } from './application/use-cases/update-person.use-case';
import { UpsertPersonSensitiveDocumentsUseCase } from './application/use-cases/upsert-person-sensitive-documents.use-case';
import { PersonContactRepository } from './infrastructure/repositories/person-contact.repository';
import { PersonFinanceRepository } from './infrastructure/repositories/person-finance.repository';
import { PersonBenefitDetentionRepository } from './infrastructure/repositories/person-benefit-detention.repository';
import { PersonHealthEducationRepository } from './infrastructure/repositories/person-health-education.repository';
import { PersonRecordMetadataRepository } from './infrastructure/repositories/person-record-metadata.repository';
import { PersonRepository } from './infrastructure/repositories/person.repository';
import { PersonRelationRepository } from './infrastructure/repositories/person-relation.repository';
import { PersonSensitiveDocumentsRepository } from './infrastructure/repositories/person-sensitive-documents.repository';

@Module({
  imports: [PrismaModule, CepModule, PiiModule, RequestContextModule],
  controllers: [PersonController],
  providers: [
    PersonService,
    PersonRepository,
    PersonRecordMetadataRepository,
    PersonContactRepository,
    PersonFinanceRepository,
    PersonAssetHouseholdRepository,
    PersonBenefitDetentionRepository,
    PersonHealthEducationRepository,
    PersonRelationRepository,
    PersonSensitiveDocumentsRepository,
    PersonFinanceService,
    PersonAssetHouseholdService,
    PersonBenefitDetentionService,
    PersonHealthEducationService,
    PersonRecordMetadataService,
    PersonRelationService,
    CreatePersonUseCase,
    CreatePersonContactUseCase,
    GetPersonByIdUseCase,
    GetPersonSensitiveDocumentsUseCase,
    ListPersonUseCase,
    ListPersonContactsUseCase,
    RemovePersonContactUseCase,
    UpdatePersonContactUseCase,
    UpdatePersonUseCase,
    UpsertPersonSensitiveDocumentsUseCase,
  ],
})
export class PersonModule {}
