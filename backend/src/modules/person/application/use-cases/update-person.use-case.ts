import { Injectable, NotFoundException } from '@nestjs/common';
import { buildUpdatePersonData } from '../mappers/person-persistence.mapper';
import { mapPerson } from '../mappers/person-response.mapper';
import type { UpdatePersonInput } from '../types/person-crud.input';
import { normalizeStatus } from '../../domain/normalizers/person-field.normalizer';
import { assertDepartureReasonForStatus } from '../../domain/validators/person-status.validator';
import { PersonRepository } from '../../infrastructure/repositories/person.repository';

@Injectable()
export class UpdatePersonUseCase {
  constructor(private readonly personRepository: PersonRepository) {}

  async execute(tenantId: string, id: string, input: UpdatePersonInput) {
    const existing = await this.personRepository.existsById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Person not found');
    }

    const nextStatus = normalizeStatus(input.status);
    assertDepartureReasonForStatus(input.status, input.departureReason);

    const data = buildUpdatePersonData(input);
    if (input.status !== undefined && nextStatus !== 'Desligado') {
      data.departureReason = null;
    }

    const person = await this.personRepository.update(id, data);
    const refreshed = await this.personRepository.findDetailById(tenantId, id);

    return mapPerson(
      refreshed ?? {
        ...person,
        _count: { healthConditions: 0, medications: 0 },
        comments: [],
        attachments: [],
      },
    );
  }
}