import { Injectable, NotFoundException } from '@nestjs/common';
import { mapPerson } from '../mappers/person-response.mapper';
import { PersonRepository } from '../../infrastructure/repositories/person.repository';

@Injectable()
export class GetPersonByIdUseCase {
  constructor(private readonly personRepository: PersonRepository) {}

  async execute(tenantId: string, id: string) {
    const person = await this.personRepository.findDetailById(tenantId, id);

    if (!person) {
      throw new NotFoundException('Person not found');
    }

    return mapPerson(person);
  }
}