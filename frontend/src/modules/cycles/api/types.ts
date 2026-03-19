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
  internalNotes: string | null;
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
  internalNotes?: string | null;
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
