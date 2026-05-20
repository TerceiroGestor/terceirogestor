import { Injectable, NotFoundException } from '@nestjs/common';
import { mapPersonContact } from '../mappers/person-response.mapper';
import { PersonRepository } from '../../infrastructure/repositories/person.repository';
import { PersonContactRepository } from '../../infrastructure/repositories/person-contact.repository';

@Injectable()
export class ListPersonContactsUseCase {
  constructor(
    private readonly personRepository: PersonRepository,
    private readonly personContactRepository: PersonContactRepository,
  ) {}

  async execute(tenantId: string, personId: string) {
    const person = await this.personRepository.existsById(tenantId, personId);
    if (!person) {
      throw new NotFoundException('Person not found');
    }

    const contacts = await this.personContactRepository.findManyByPersonId(
      tenantId,
      personId,
    );

    return contacts.map(mapPersonContact);
  }
}