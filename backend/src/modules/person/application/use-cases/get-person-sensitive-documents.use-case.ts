import { Injectable, NotFoundException } from '@nestjs/common';
import { PiiCryptoService } from '../../../../core/pii/pii-crypto.service';
import { RequestContextService } from '../../../../core/request-context/request-context.service';
import type { PersonSensitiveDocumentsPayload } from '../types/person-sensitive-documents.input';
import { PersonRepository } from '../../infrastructure/repositories/person.repository';
import { PersonSensitiveDocumentsRepository } from '../../infrastructure/repositories/person-sensitive-documents.repository';

@Injectable()
export class GetPersonSensitiveDocumentsUseCase {
  constructor(
    private readonly personRepository: PersonRepository,
    private readonly sensitiveDocumentsRepository: PersonSensitiveDocumentsRepository,
    private readonly pii: PiiCryptoService,
    private readonly requestContext: RequestContextService,
  ) {}

  async execute(tenantId: string, personId: string) {
    const person = await this.personRepository.existsById(tenantId, personId);
    if (!person) {
      throw new NotFoundException('Person not found');
    }

    const context = this.requestContext.get();
    await this.sensitiveDocumentsRepository.logAccess({
      tenantId,
      personId,
      userId: context?.userId ?? null,
      action: 'READ',
      ipAddress: context?.ipAddress ?? null,
      userAgent: context?.userAgent ?? null,
    });

    const record = await this.sensitiveDocumentsRepository.findByPersonId(
      tenantId,
      personId,
    );
    if (!record) {
      return null;
    }

    const payload = this.pii.decryptForTenant<PersonSensitiveDocumentsPayload>(
      tenantId,
      {
        dataEnc: record.dataEnc,
        iv: record.iv,
        tag: record.tag,
      },
    );

    return {
      ...payload,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}