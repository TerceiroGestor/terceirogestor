import type { ProgramsPagination } from "./shared";

export type ProgramType =
  | "SCFV"
  | "PAIF"
  | "PAEFI"
  | "CULTURAL"
  | "QUALIFICATION"
  | "OTHER";

export type ProgramStatus = "PLANNED" | "ACTIVE" | "CLOSED";

export type ApiProgram = {
  id: string;
  tenantId: string;
  name: string;
  type: ProgramType;
  description: string | null;
  internalNotes: string | null;
  status: ProgramStatus;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProgramsListResponse = {
  data: ApiProgram[];
  pagination: ProgramsPagination;
};

export type ProgramInput = {
  name: string;
  type: ProgramType;
  description?: string | null;
  internalNotes?: string | null;
  status?: ProgramStatus;
  startsAt?: string | null;
  endsAt?: string | null;
};
