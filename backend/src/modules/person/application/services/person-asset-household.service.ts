import { Injectable, NotFoundException } from '@nestjs/common';
import { mapHouseholdAsset, mapPersonAsset, mapHouseholdProfile } from '../mappers/person-response.mapper';
import { CreateHouseholdAssetDto } from '../../dto/create-household-asset.dto';
import { UpdateHouseholdAssetDto } from '../../dto/update-household-asset.dto';
import { CreatePersonAssetDto } from '../../dto/create-person-asset.dto';
import { UpdatePersonAssetDto } from '../../dto/update-person-asset.dto';
import { UpsertHouseholdProfileDto } from '../../dto/upsert-household-profile.dto';
import { PersonAssetHouseholdRepository } from '../../infrastructure/repositories/person-asset-household.repository';
import { PersonRepository } from '../../infrastructure/repositories/person.repository';

@Injectable()
export class PersonAssetHouseholdService {
  constructor(
    private readonly personRepository: PersonRepository,
    private readonly repository: PersonAssetHouseholdRepository,
  ) {}

  // Household Assets
  async listHouseholdAssets(tenantId: string, personId: string) {
    await this.assertPersonExists(tenantId, personId);
    const items = await this.repository.listHouseholdAssets(tenantId, personId);
    return items.map(mapHouseholdAsset);
  }

  async createHouseholdAsset(tenantId: string, personId: string, dto: CreateHouseholdAssetDto) {
    await this.assertPersonExists(tenantId, personId);
    const asset = await this.repository.createHouseholdAsset({
      tenantId,
      personId,
      ...dto,
    });
    return mapHouseholdAsset(asset);
  }

  async updateHouseholdAsset(tenantId: string, personId: string, assetId: string, dto: UpdateHouseholdAssetDto) {
    const asset = await this.repository.findHouseholdAsset(tenantId, personId, assetId);
    if (!asset) throw new NotFoundException('Household asset não encontrado.');
    const updated = await this.repository.updateHouseholdAsset(assetId, dto);
    return mapHouseholdAsset(updated);
  }

  async removeHouseholdAsset(tenantId: string, personId: string, assetId: string) {
    const asset = await this.repository.findHouseholdAsset(tenantId, personId, assetId);
    if (!asset) throw new NotFoundException('Household asset não encontrado.');
    await this.repository.deleteHouseholdAsset(assetId);
    return { deleted: true };
  }

  // Person Assets
  async listPersonAssets(tenantId: string, personId: string) {
    await this.assertPersonExists(tenantId, personId);
    const items = await this.repository.listPersonAssets(tenantId, personId);
    return items.map(mapPersonAsset);
  }

  async createPersonAsset(tenantId: string, personId: string, dto: CreatePersonAssetDto) {
    await this.assertPersonExists(tenantId, personId);
    const asset = await this.repository.createPersonAsset({
      tenantId,
      personId,
      ...dto,
    });
    return mapPersonAsset(asset);
  }

  async updatePersonAsset(tenantId: string, personId: string, assetId: string, dto: UpdatePersonAssetDto) {
    const asset = await this.repository.findPersonAsset(tenantId, personId, assetId);
    if (!asset) throw new NotFoundException('Person asset não encontrado.');
    const updated = await this.repository.updatePersonAsset(assetId, dto);
    return mapPersonAsset(updated);
  }

  async removePersonAsset(tenantId: string, personId: string, assetId: string) {
    const asset = await this.repository.findPersonAsset(tenantId, personId, assetId);
    if (!asset) throw new NotFoundException('Person asset não encontrado.');
    await this.repository.deletePersonAsset(assetId);
    return { deleted: true };
  }

  // Household Profile
  async getHouseholdProfile(tenantId: string, personId: string) {
    await this.assertPersonExists(tenantId, personId);
    const profile = await this.repository.getHouseholdProfile(tenantId, personId);
    if (!profile) throw new NotFoundException('Household profile não encontrado.');
    return mapHouseholdProfile(profile);
  }

  async upsertHouseholdProfile(tenantId: string, personId: string, dto: UpsertHouseholdProfileDto) {
    await this.assertPersonExists(tenantId, personId);
    // Simples: sempre cria novo profile
    const profile = await this.repository.upsertHouseholdProfile({
      tenantId,
      personId,
      ...dto,
    });
    return mapHouseholdProfile(profile);
  }

  private async assertPersonExists(tenantId: string, personId: string) {
    const person = await this.personRepository.existsById(tenantId, personId);
    if (!person) throw new NotFoundException('Person not found');
  }
}
