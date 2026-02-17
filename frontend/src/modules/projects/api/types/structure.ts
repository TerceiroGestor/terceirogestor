import type { ProjectsPagination } from "./shared";

export type EnrollmentStatus = "ACTIVE" | "ENDED";

export type ApiProjectGroup = {
  id: string;
  tenantId: string;
  projectId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiProjectCycle = {
  id: string;
  tenantId: string;
  projectId: string;
  name: string;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiEnrollmentPerson = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  birthDate: string | null;
  status: string | null;
  sex?: string | null;
  gender?: string | null;
  raceColor?: string | null;
};

export type ApiProjectEnrollment = {
  id: string;
  tenantId: string;
  projectId: string;
  personId: string;
  status: EnrollmentStatus;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
  person: ApiEnrollmentPerson;
  groups: { id: string; name: string }[];
  cycle: { id: string; name: string } | null;
};

export type ProjectGroupInput = {
  name: string;
  description?: string | null;
};

export type ProjectCycleInput = {
  name: string;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type ProjectEnrollmentInput = {
  personId: string;
  status?: EnrollmentStatus;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type EnrollmentGroupInput = {
  groupId: string;
};

export type EnrollmentCycleInput = {
  cycleId: string | null;
};

export type ProjectEnrollmentsListResponse = {
  data: ApiProjectEnrollment[];
  pagination: ProjectsPagination;
};
