import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../generated/prisma';
import { PrismaService } from '../../../../core/prisma/prisma.service';

@Injectable()
export class PersonContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByPersonId(tenantId: string, personId: string) {
    return this.prisma.personContact.findMany({
      where: { tenantId, personId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findById(tenantId: string, personId: string, contactId: string) {
    return this.prisma.personContact.findFirst({
      where: { id: contactId, tenantId, personId },
    });
  }

  createWithPrimaryHandling(
    tenantId: string,
    personId: string,
    data: Prisma.PersonContactUncheckedCreateInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (data.isPrimary) {
        await tx.personContact.updateMany({
          where: { tenantId, personId, type: data.type, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      return tx.personContact.create({ data });
    });
  }

  updateWithPrimaryHandling(args: {
    tenantId: string;
    personId: string;
    contactId: string;
    nextType: 'EMAIL' | 'PHONE';
    updateData: Prisma.PersonContactUpdateInput;
    isPrimary: boolean;
  }) {
    return this.prisma.$transaction(async (tx) => {
      if (args.isPrimary) {
        await tx.personContact.updateMany({
          where: {
            tenantId: args.tenantId,
            personId: args.personId,
            type: args.nextType,
            isPrimary: true,
          },
          data: { isPrimary: false },
        });
      }

      return tx.personContact.update({
        where: { id: args.contactId },
        data: args.updateData,
      });
    });
  }

  deleteById(contactId: string) {
    return this.prisma.personContact.delete({ where: { id: contactId } });
  }
}