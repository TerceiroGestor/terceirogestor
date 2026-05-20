import type { Prisma } from '../../../../generated/prisma';

export const PERSON_DETAIL_INCLUDE = {
  _count: {
    select: { healthConditions: true, medications: true },
  },
  comments: {
    orderBy: { createdAt: 'desc' },
    include: {
      authorUser: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  },
  attachments: {
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedByUser: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  },
} satisfies Prisma.PersonInclude;

export const PERSON_RECORD_COMMENT_INCLUDE = {
  authorUser: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  },
} satisfies Prisma.PersonRecordCommentInclude;

export const PERSON_RECORD_ATTACHMENT_INCLUDE = {
  uploadedByUser: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  },
} satisfies Prisma.PersonRecordAttachmentInclude;