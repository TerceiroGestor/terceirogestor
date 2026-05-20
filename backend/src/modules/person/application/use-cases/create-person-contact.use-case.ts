import { Injectable, NotFoundException } from '@nestjs/common';
import { buildCreatePersonContactData } from '../mappers/person-contact-persistence.mapper';
import { mapPersonContact } from '../mappers/person-response.mapper';
import type { CreatePersonContactInput } from '../types/person-contact.input';
import { PersonRepository } from '../../infrastructure/repositories/person.repository';
import { PersonContactRepository } from '../../infrastructure/repositories/person-contact.repository';

@Injectable()
export class CreatePersonContactUseCase {
  constructor(
    private readonly personRepository: PersonRepository,
    private readonly personContactRepository: PersonContactRepository,
  ) {}

  async execute(
    tenantId: string,
    personId: string,
    input: CreatePersonContactInput,
  ) {
    const person = await this.personRepository.existsById(tenantId, personId);
    if (!person) {
      throw new NotFoundException('Person not found');
    }

    const data = buildCreatePersonContactData(tenantId, personId, input);
    const created = await this.personContactRepository.createWithPrimaryHandling(
      tenantId,
      personId,
      data,
    );

    return mapPersonContact(created);
  }
}