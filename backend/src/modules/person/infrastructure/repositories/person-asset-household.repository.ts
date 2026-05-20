import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../generated/prisma';
import { PrismaService } from '../../../../core/prisma/prisma.service';

@Injectable()
export class PersonAssetHouseholdRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Household Assets
  listHouseholdAssets(tenantId: string, personId: string) {
    return this.prisma.householdAsset.findMany({
      where: { tenantId, personId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findHouseholdAsset(tenantId: string, personId: string, assetId: string) {
    return this.prisma.householdAsset.findFirst({
      where: { id: assetId, tenantId, personId },
    });
  }

  createHouseholdAsset(data: Prisma.HouseholdAssetUncheckedCreateInput) {
    return this.prisma.householdAsset.create({ data });
  }

  updateHouseholdAsset(assetId: string, data: Prisma.HouseholdAssetUpdateInput) {
    return this.prisma.householdAsset.update({ where: { id: assetId }, data });
  }

  deleteHouseholdAsset(assetId: string) {
    return this.prisma.householdAsset.delete({ where: { id: assetId } });
  }

  // Person Assets
  listPersonAssets(tenantId: string, personId: string) {
    return this.prisma.personAsset.findMany({
      where: { tenantId, personId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findPersonAsset(tenantId: string, personId: string, assetId: string) {
    return this.prisma.personAsset.findFirst({
      where: { id: assetId, tenantId, personId },
    });
  }

  createPersonAsset(data: Prisma.PersonAssetUncheckedCreateInput) {
    return this.prisma.personAsset.create({ data });
  }

  updatePersonAsset(assetId: string, data: Prisma.PersonAssetUpdateInput) {
    return this.prisma.personAsset.update({ where: { id: assetId }, data });
  }

  deletePersonAsset(assetId: string) {
    return this.prisma.personAsset.delete({ where: { id: assetId } });
  }

  // Household Profile
  getHouseholdProfile(tenantId: string, personId: string) {
    return this.prisma.householdProfile.findFirst({
      where: { tenantId, personId },
      orderBy: { createdAt: 'desc' },
    });
  }

  upsertHouseholdProfile(data: Prisma.HouseholdProfileUncheckedCreateInput) {
    return this.prisma.householdProfile.create({ data });
  }

  updateHouseholdProfile(profileId: string, data: Prisma.HouseholdProfileUpdateInput) {
    return this.prisma.householdProfile.update({ where: { id: profileId }, data });
  }
}
