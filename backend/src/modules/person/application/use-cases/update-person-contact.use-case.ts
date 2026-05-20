import { Injectable, NotFoundException } from '@nestjs/common';
import { buildUpdatePersonContactData } from '../mappers/person-contact-persistence.mapper';
import { mapPersonContact } from '../mappers/person-response.mapper';
import type { UpdatePersonContactInput } from '../types/person-contact.input';
import { PersonRepository } from '../../infrastructure/repositories/person.repository';
import { PersonContactRepository } from '../../infrastructure/repositories/person-contact.repository';

@Injectable()
export class UpdatePersonContactUseCase {
  constructor(
    private readonly personRepository: PersonRepository,
    private readonly personContactRepository: PersonContactRepository,
  ) {}

  async execute(
    tenantId: string,
    personId: string,
    contactId: string,
    input: UpdatePersonContactInput,
  ) {
    const person = await this.personRepository.existsById(tenantId, personId);
    if (!person) {
      throw new NotFoundException('Person not found');
    }

    const existing = await this.personContactRepository.findById(
      tenantId,
      personId,
      contactId,
    );
    if (!existing) {
      throw new NotFoundException('Contato não encontrado.');
    }

    const { nextType, updateData } = buildUpdatePersonContactData(
      existing,
      input,
    );

    const updated = await this.personContactRepository.updateWithPrimaryHandling({
      tenantId,
      personId,
      contactId,
      nextType,
      updateData,
      isPrimary: input.isPrimary === true,
    });

    return mapPersonContact(updated);
  }
}