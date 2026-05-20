import { Injectable } from '@nestjs/common';
import { buildCreatePersonData } from '../mappers/person-persistence.mapper';
import { mapPerson } from '../mappers/person-response.mapper';
import type { CreatePersonInput } from '../types/person-crud.input';
import { assertDepartureReasonForStatus } from '../../domain/validators/person-status.validator';
import { PersonRepository } from '../../infrastructure/repositories/person.repository';

@Injectable()
export class CreatePersonUseCase {
  constructor(private readonly personRepository: PersonRepository) {}

  async execute(tenantId: string, input: CreatePersonInput) {
    assertDepartureReasonForStatus(input.status, input.departureReason);

    const person = await this.personRepository.create(
      tenantId,
      buildCreatePersonData(tenantId, input),
    );

    return mapPerson(person);
  }
}