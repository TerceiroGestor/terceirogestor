import { Injectable, NotFoundException } from '@nestjs/common';
import { PersonRepository } from '../../infrastructure/repositories/person.repository';
import { PersonContactRepository } from '../../infrastructure/repositories/person-contact.repository';

@Injectable()
export class RemovePersonContactUseCase {
  constructor(
    private readonly personRepository: PersonRepository,
    private readonly personContactRepository: PersonContactRepository,
  ) {}

  async execute(tenantId: string, personId: string, contactId: string) {
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

    await this.personContactRepository.deleteById(contactId);
    return { deleted: true };
  }
}