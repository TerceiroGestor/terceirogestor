import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../generated/prisma';
import { PrismaService } from '../../../../core/prisma/prisma.service';

@Injectable()
export class PersonBenefitDetentionRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Benefits
  listBenefits(tenantId: string, personId: string) {
    return this.prisma.personBenefit.findMany({
      where: { tenantId, personId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findBenefit(tenantId: string, personId: string, benefitId: string) {
    return this.prisma.personBenefit.findFirst({
      where: { id: benefitId, tenantId, personId },
    });
  }

  createBenefit(data: Prisma.PersonBenefitUncheckedCreateInput) {
    return this.prisma.personBenefit.create({ data });
  }

  updateBenefit(benefitId: string, data: Prisma.PersonBenefitUpdateInput) {
    return this.prisma.personBenefit.update({
      where: { id: benefitId },
      data,
    });
  }

  deleteBenefit(benefitId: string) {
    return this.prisma.personBenefit.delete({ where: { id: benefitId } });
  }

  // Detentions
  listDetentions(tenantId: string, personId: string) {
    return this.prisma.personDetention.findMany({
      where: { tenantId, personId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findDetention(tenantId: string, personId: string, detentionId: string) {
    return this.prisma.personDetention.findFirst({
      where: { id: detentionId, tenantId, personId },
    });
  }

  createDetention(data: Prisma.PersonDetentionUncheckedCreateInput) {
    return this.prisma.personDetention.create({ data });
  }

  updateDetention(detentionId: string, data: Prisma.PersonDetentionUpdateInput) {
    return this.prisma.personDetention.update({
      where: { id: detentionId },
      data,
    });
  }

  deleteDetention(detentionId: string) {
    return this.prisma.personDetention.delete({ where: { id: detentionId } });
  }
}
