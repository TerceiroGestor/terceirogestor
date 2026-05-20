import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';

type EncryptedPayload = {
  dataEnc: string;
  iv: string;
  tag: string;
};

@Injectable()
export class PersonSensitiveDocumentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByPersonId(tenantId: string, personId: string) {
    return this.prisma.personSensitiveDocument.findFirst({
      where: { tenantId, personId },
    });
  }

  upsertEncryptedDocument(
    tenantId: string,
    personId: string,
    encrypted: EncryptedPayload,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const document = await tx.personSensitiveDocument.upsert({
        where: { personId },
        create: {
          tenantId,
          personId,
          schemaVersion: 1,
          dataEnc: encrypted.dataEnc,
          iv: encrypted.iv,
          tag: encrypted.tag,
        },
        update: {
          schemaVersion: 1,
          dataEnc: encrypted.dataEnc,
          iv: encrypted.iv,
          tag: encrypted.tag,
        },
      });

      await tx.person.update({
        where: { id: personId },
        data: { document: null, rg: null, nis: null },
      });

      return document;
    });
  }

  logAccess(args: {
    tenantId: string;
    personId: string;
    userId?: string | null;
    action: 'READ' | 'UPDATE';
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    return this.prisma.personSensitiveAccessLog.create({
      data: {
        tenantId: args.tenantId,
        personId: args.personId,
        userId: args.userId ?? null,
        action: args.action,
        ipAddress: args.ipAddress ?? null,
        userAgent: args.userAgent ?? null,
      },
    });
  }
}