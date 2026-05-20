import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { normalizeString } from '../../../../core/utils/strings';
import { parseDateInput } from '../../../../core/utils/dates';
import { mapBenefit, mapDetention } from '../mappers/person-response.mapper';
import { CreatePersonBenefitDto } from '../../dto/create-person-benefit.dto';
import { UpdatePersonBenefitDto } from '../../dto/update-person-benefit.dto';
import { CreatePersonDetentionDto } from '../../dto/create-person-detention.dto';
import { UpdatePersonDetentionDto } from '../../dto/update-person-detention.dto';
import { PersonBenefitDetentionRepository } from '../../infrastructure/repositories/person-benefit-detention.repository';
import { PersonRepository } from '../../infrastructure/repositories/person.repository';

@Injectable()
export class PersonBenefitDetentionService {
  constructor(
    private readonly personRepository: PersonRepository,
    private readonly repository: PersonBenefitDetentionRepository,
  ) {}

  // Benefits
  async listBenefits(tenantId: string, personId: string) {
    await this.assertPersonExists(tenantId, personId);
    const items = await this.repository.listBenefits(tenantId, personId);
    return items.map(mapBenefit);
  }

  async createBenefit(
    tenantId: string,
    personId: string,
    dto: CreatePersonBenefitDto,
  ) {
    await this.assertPersonExists(tenantId, personId);
    const type = normalizeString(dto.type);
    if (!type) throw new BadRequestException('Benefício inválido.');
    const benefit = await this.repository.createBenefit({
      tenantId,
      personId,
      type,
      description: dto.description ? normalizeString(dto.description) : null,
      value: dto.value ?? null,
      startDate: dto.startDate ? parseDateInput(dto.startDate) : null,
      endDate: dto.endDate ? parseDateInput(dto.endDate) : null,
      notes: dto.notes ? normalizeString(dto.notes) : null,
    });
    return mapBenefit(benefit);
  }

  async updateBenefit(
    tenantId: string,
    personId: string,
    benefitId: string,
    dto: UpdatePersonBenefitDto,
  ) {
    const benefit = await this.repository.findBenefit(tenantId, personId, benefitId);
    if (!benefit) throw new NotFoundException('Benefício não encontrado.');
    const type = dto.type !== undefined ? normalizeString(dto.type) ?? undefined : undefined;
    if (dto.type !== undefined && !type) throw new BadRequestException('Benefício inválido.');
    const updated = await this.repository.updateBenefit(benefitId, {
      type,
      description: dto.description !== undefined ? normalizeString(dto.description) : undefined,
      value: dto.value !== undefined ? dto.value : undefined,
      startDate: dto.startDate !== undefined ? (dto.startDate ? parseDateInput(dto.startDate) : null) : undefined,
      endDate: dto.endDate !== undefined ? (dto.endDate ? parseDateInput(dto.endDate) : null) : undefined,
      notes: dto.notes !== undefined ? normalizeString(dto.notes) : undefined,
    });
    return mapBenefit(updated);
  }

  async removeBenefit(tenantId: string, personId: string, benefitId: string) {
    const benefit = await this.repository.findBenefit(tenantId, personId, benefitId);
    if (!benefit) throw new NotFoundException('Benefício não encontrado.');
    await this.repository.deleteBenefit(benefitId);
    return { deleted: true };
  }

  // Detentions
  async listDetentions(tenantId: string, personId: string) {
    await this.assertPersonExists(tenantId, personId);
    const items = await this.repository.listDetentions(tenantId, personId);
    return items.map(mapDetention);
  }

  async createDetention(
    tenantId: string,
    personId: string,
    dto: CreatePersonDetentionDto,
  ) {
    await this.assertPersonExists(tenantId, personId);
    const type = normalizeString(dto.type);
    if (!type) throw new BadRequestException('Detenção inválida.');
    const detention = await this.repository.createDetention({
      tenantId,
      personId,
      type,
      description: dto.description ? normalizeString(dto.description) : null,
      startDate: dto.startDate ? parseDateInput(dto.startDate) : null,
      endDate: dto.endDate ? parseDateInput(dto.endDate) : null,
      notes: dto.notes ? normalizeString(dto.notes) : null,
    });
    return mapDetention(detention);
  }

  async updateDetention(
    tenantId: string,
    personId: string,
    detentionId: string,
    dto: UpdatePersonDetentionDto,
  ) {
    const detention = await this.repository.findDetention(tenantId, personId, detentionId);
    if (!detention) throw new NotFoundException('Detenção não encontrada.');
    const type = dto.type !== undefined ? normalizeString(dto.type) ?? undefined : undefined;
    if (dto.type !== undefined && !type) throw new BadRequestException('Detenção inválida.');
    const updated = await this.repository.updateDetention(detentionId, {
      type,
      description: dto.description !== undefined ? normalizeString(dto.description) : undefined,
      startDate: dto.startDate !== undefined ? (dto.startDate ? parseDateInput(dto.startDate) : null) : undefined,
      endDate: dto.endDate !== undefined ? (dto.endDate ? parseDateInput(dto.endDate) : null) : undefined,
      notes: dto.notes !== undefined ? normalizeString(dto.notes) : undefined,
    });
    return mapDetention(updated);
  }

  async removeDetention(tenantId: string, personId: string, detentionId: string) {
    const detention = await this.repository.findDetention(tenantId, personId, detentionId);
    if (!detention) throw new NotFoundException('Detenção não encontrada.');
    await this.repository.deleteDetention(detentionId);
    return { deleted: true };
  }

  private async assertPersonExists(tenantId: string, personId: string) {
    const person = await this.personRepository.existsById(tenantId, personId);
    if (!person) throw new NotFoundException('Person not found');
  }
}
