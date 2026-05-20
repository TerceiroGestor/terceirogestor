import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import type { PersonRecordType } from '../../domain/constants/person.constants';
import {
  PERSON_RECORD_ATTACHMENT_INCLUDE,
  PERSON_RECORD_COMMENT_INCLUDE,
} from '../persistence/person-prisma.constants';

@Injectable()
export class PersonRecordMetadataRepository {
  constructor(private readonly prisma: PrismaService) {}

  findComment(tenantId: string, personId: string, commentId: string) {
    return this.prisma.personComment.findFirst({
      where: { id: commentId, tenantId, personId },
      select: { id: true },
    });
  }

  findAttachment(tenantId: string, personId: string, attachmentId: string) {
    return this.prisma.personAttachment.findFirst({
      where: { id: attachmentId, tenantId, personId },
      select: { id: true },
    });
  }

  findExistingUserIds(tenantId: string, userIds: string[]) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        id: { in: userIds },
      },
      select: { id: true },
    });
  }

  createComment(data: {
    tenantId: string;
    personId: string;
    authorUserId: string;
    body: string;
    mentionUserIds: string[];
  }) {
    return this.prisma.personComment.create({ data });
  }

  deleteComment(id: string) {
    return this.prisma.personComment.delete({ where: { id } });
  }

  createAttachment(data: {
    tenantId: string;
    personId: string;
    uploadedByUserId: string;
    label: string;
    filePath: string;
    mimeType: string | null;
    fileSizeBytes: number | null;
  }) {
    return this.prisma.personAttachment.create({ data });
  }

  deleteAttachment(id: string) {
    return this.prisma.personAttachment.delete({ where: { id } });
  }

  findRecordByType(
    tenantId: string,
    personId: string,
    recordType: PersonRecordType,
    recordId: string,
  ) {
    switch (recordType) {
      case 'education':
        return this.prisma.personEducation.findFirst({
          where: { tenantId, personId, id: recordId },
          select: { id: true },
        });
      case 'health-condition':
        return this.prisma.personHealthCondition.findFirst({
          where: { tenantId, personId, id: recordId },
          select: { id: true },
        });
      case 'medication':
        return this.prisma.personMedication.findFirst({
          where: { tenantId, personId, id: recordId },
          select: { id: true },
        });
      case 'detention':
        return this.prisma.personDetention.findFirst({
          where: { tenantId, personId, id: recordId },
          select: { id: true },
        });
      case 'financial-entry':
        return this.prisma.personFinancialEntry.findFirst({
          where: { tenantId, personId, id: recordId },
          select: { id: true },
        });
      case 'family-relation':
        return this.prisma.personRelation.findFirst({
          where: { tenantId, personId, id: recordId },
          select: { id: true },
        });
      case 'contact':
        return this.prisma.personContact.findFirst({
          where: { tenantId, personId, id: recordId },
          select: { id: true },
        });
    }
  }

  listRecordMetadata(
    tenantId: string,
    personId: string,
    recordType: PersonRecordType,
    recordId: string,
  ) {
    return Promise.all([
      this.prisma.personRecordComment.findMany({
        where: { tenantId, personId, recordType, recordId },
        orderBy: { createdAt: 'desc' },
        include: PERSON_RECORD_COMMENT_INCLUDE,
      }),
      this.prisma.personRecordAttachment.findMany({
        where: { tenantId, personId, recordType, recordId },
        orderBy: { createdAt: 'desc' },
        include: PERSON_RECORD_ATTACHMENT_INCLUDE,
      }),
      this.prisma.personRecordTag.findMany({
        where: { tenantId, personId, recordType, recordId },
        orderBy: [{ value: 'asc' }],
        select: { value: true },
      }),
    ]);
  }

  findRecordComment(
    tenantId: string,
    personId: string,
    recordType: PersonRecordType,
    recordId: string,
    commentId: string,
  ) {
    return this.prisma.personRecordComment.findFirst({
      where: { id: commentId, tenantId, personId, recordType, recordId },
      select: { id: true },
    });
  }

  createRecordComment(data: {
    tenantId: string;
    personId: string;
    recordType: PersonRecordType;
    recordId: string;
    authorUserId: string;
    body: string;
    mentionUserIds: string[];
  }) {
    return this.prisma.personRecordComment.create({ data });
  }

  deleteRecordComment(id: string) {
    return this.prisma.personRecordComment.delete({ where: { id } });
  }

  findRecordAttachment(
    tenantId: string,
    personId: string,
    recordType: PersonRecordType,
    recordId: string,
    attachmentId: string,
  ) {
    return this.prisma.personRecordAttachment.findFirst({
      where: { id: attachmentId, tenantId, personId, recordType, recordId },
      select: { id: true },
    });
  }

  createRecordAttachment(data: {
    tenantId: string;
    personId: string;
    recordType: PersonRecordType;
    recordId: string;
    uploadedByUserId: string;
    label: string;
    filePath: string;
    mimeType: string | null;
    fileSizeBytes: number | null;
  }) {
    return this.prisma.personRecordAttachment.create({ data });
  }

  deleteRecordAttachment(id: string) {
    return this.prisma.personRecordAttachment.delete({ where: { id } });
  }

  replaceRecordTags(data: {
    tenantId: string;
    personId: string;
    recordType: PersonRecordType;
    recordId: string;
    values: string[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.personRecordTag.deleteMany({
        where: {
          tenantId: data.tenantId,
          personId: data.personId,
          recordType: data.recordType,
          recordId: data.recordId,
        },
      });

      if (!data.values.length) {
        return;
      }

      await tx.personRecordTag.createMany({
        data: data.values.map((value) => ({
          tenantId: data.tenantId,
          personId: data.personId,
          recordType: data.recordType,
          recordId: data.recordId,
          value,
        })),
      });
    });
  }
}