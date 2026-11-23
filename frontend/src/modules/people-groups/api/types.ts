import type { ApiPerson } from "@/modules/people/api";

export type ApiPeopleGroup = {
  id: string;
  tenantId: string;
  name: string;
  groupType: "CYCLE" | "SEGMENT" | "TEAM_POOL" | "NETWORK" | "OTHER";
  purpose: "PUBLICO" | "EQUIPE";
  category: string | null;
  description: string | null;
  tags: string[];
  ageMin: number | null;
  ageMax: number | null;
  isActive: boolean;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: ApiPeopleGroupAttachment[];
  _count?: {
    participations?: number;
  };
};

export type ApiPeopleGroupAttachment = {
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

export type PeopleGroupInput = {
  name: string;
  groupType?: ApiPeopleGroup["groupType"];
  purpose?: ApiPeopleGroup["purpose"];
  category?: string | null;
  description?: string | null;
  tags?: string[];
  ageMin?: number | null;
  ageMax?: number | null;
  isActive?: boolean;
  internalNotes?: string | null;
};

export type PeopleGroupAttachmentInput = {
  label: string;
  filePath: string;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
};

export type ApiPeopleGroupParticipation = {
  id: string;
  tenantId: string;
  peopleGroupId: string;
  personId: string;
  activeKey: string | null;
  isActive: boolean;
  startsAt: string;
  endsAt: string | null;
  deletedAt: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  person: ApiPerson;
};

export type CreatePeopleGroupParticipationInput = {
  personId: string;
  startsAt?: string;
  internalNotes?: string | null;
};

export type EndPeopleGroupParticipationInput = {
  endsAt?: string;
  internalNotes?: string | null;
};

export type PeopleGroupsListResponse = {
  data: ApiPeopleGroup[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type PeopleGroupParticipationsListResponse = {
  data: ApiPeopleGroupParticipation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};
