import { Injectable, NotFoundException } from '@nestjs/common';
import { PiiCryptoService } from '../../../../core/pii/pii-crypto.service';
import { RequestContextService } from '../../../../core/request-context/request-context.service';
import {
  normalizeCnsDigitsOrNull,
  normalizeCpfDigitsOrNull,
  normalizeNisDigitsOrNull,
  normalizeRgOrNull,
} from '../../domain/normalizers/person-field.normalizer';
import type {
  PersonSensitiveDocumentsPayload,
  UpsertPersonSensitiveDocumentsInput,
} from '../types/person-sensitive-documents.input';
import { PersonRepository } from '../../infrastructure/repositories/person.repository';
import { PersonSensitiveDocumentsRepository } from '../../infrastructure/repositories/person-sensitive-documents.repository';

@Injectable()
export class UpsertPersonSensitiveDocumentsUseCase {
  constructor(
    private readonly personRepository: PersonRepository,
    private readonly sensitiveDocumentsRepository: PersonSensitiveDocumentsRepository,
    private readonly pii: PiiCryptoService,
    private readonly requestContext: RequestContextService,
  ) {}

  async execute(
    tenantId: string,
    personId: string,
    input: UpsertPersonSensitiveDocumentsInput,
  ) {
    const person = await this.personRepository.existsById(tenantId, personId);
    if (!person) {
      throw new NotFoundException('Person not found');
    }

    const existing = await this.sensitiveDocumentsRepository.findByPersonId(
      tenantId,
      personId,
    );

    const current = existing
      ? this.pii.decryptForTenant<PersonSensitiveDocumentsPayload>(tenantId, {
          dataEnc: existing.dataEnc,
          iv: existing.iv,
          tag: existing.tag,
        })
      : {
          cpf: null,
          rg: null,
          nis: null,
          cns: null,
        };

    const next: PersonSensitiveDocumentsPayload = {
      cpf:
        input.cpf !== undefined
          ? normalizeCpfDigitsOrNull(input.cpf)
          : current.cpf,
      rg: input.rg !== undefined ? normalizeRgOrNull(input.rg) : current.rg,
      nis:
        input.nis !== undefined
          ? normalizeNisDigitsOrNull(input.nis)
          : current.nis,
      cns:
        input.cns !== undefined
          ? normalizeCnsDigitsOrNull(input.cns)
          : current.cns,
    };

    const encrypted = this.pii.encryptForTenant(tenantId, next);
    const saved = await this.sensitiveDocumentsRepository.upsertEncryptedDocument(
      tenantId,
      personId,
      encrypted,
    );

    const context = this.requestContext.get();
    await this.sensitiveDocumentsRepository.logAccess({
      tenantId,
      personId,
      userId: context?.userId ?? null,
      action: 'UPDATE',
      ipAddress: context?.ipAddress ?? null,
      userAgent: context?.userAgent ?? null,
    });

    const payload = this.pii.decryptForTenant<PersonSensitiveDocumentsPayload>(
      tenantId,
      {
        dataEnc: saved.dataEnc,
        iv: saved.iv,
        tag: saved.tag,
      },
    );

    return {
      ...payload,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }
}