import type { ProjectsPagination } from "./shared";
import type { ProgramStatus, ProgramType } from "@/modules/programs/api";

export type ProjectStatus = "PLANNED" | "ACTIVE" | "CLOSED";

export type ApiProjectProgram = {
  id: string;
  name: string;
  type?: ProgramType;
  status?: ProgramStatus;
};

export type ApiProject = {
  id: string;
  tenantId: string;
  programId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
  program: ApiProjectProgram;
};

export type ProjectsListResponse = {
  data: ApiProject[];
  pagination: ProjectsPagination;
};

export type ProjectInput = {
  programId: string;
  name: string;
  description?: string | null;
  status?: ProjectStatus;
  startsAt?: string | null;
  endsAt?: string | null;
};

