export type CycleAudienceType =
  | "CHILDREN"
  | "TEENS"
  | "ADULTS"
  | "FAMILIES"
  | "OTHER";

export type ApiCycle = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  audienceType: CycleAudienceType | string | null;
  ageMin: number | null;
  ageMax: number | null;
  isActive: boolean;
  tags: string[];
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  comments: ApiCycleComment[];
  attachments: ApiCycleAttachment[];
};

export type ApiCycleComment = {
  id: string;
  body: string;
  mentionUserIds: string[];
  author: {
    id: string | null;
    name: string;
    email?: string | null;
    avatarUrl?: string | null;
  };
  createdAt: string;
  updatedAt: string;
};

export type ApiCycleAttachment = {
  id: string;
  label: string;
  filePath: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  uploadedBy: {
    id: string | null;
    name: string;
    email?: string | null;
    avatarUrl?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type CycleInput = {
  name: string;
  description?: string | null;
  audienceType?: CycleAudienceType | string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  isActive?: boolean;
  tags?: string[];
  internalNotes?: string | null;
};

export type CycleCommentInput = {
  body: string;
  mentionUserIds?: string[];
};

export type CycleAttachmentInput = {
  label: string;
  filePath: string;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
};

export type CyclesListResponse = {
  data: ApiCycle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};
