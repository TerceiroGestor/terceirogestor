import { apiRequest, buildQuery } from "@/lib/api";
import type {
  ApiProjectCycle,
  ApiProjectEnrollment,
  ApiProjectGroup,
  EnrollmentCycleInput,
  EnrollmentGroupInput,
  ProjectCycleInput,
  ProjectEnrollmentInput,
  ProjectEnrollmentsListResponse,
  ProjectGroupInput,
} from "./types";

export async function listProjectGroups(token: string, projectId: string) {
  return apiRequest<ApiProjectGroup[]>(
    `/projects/${projectId}/groups`,
    {},
    token,
  );
}

export async function createProjectGroup(
  token: string,
  projectId: string,
  payload: ProjectGroupInput,
) {
  return apiRequest<ApiProjectGroup>(
    `/projects/${projectId}/groups`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function updateProjectGroup(
  token: string,
  projectId: string,
  groupId: string,
  payload: Partial<ProjectGroupInput>,
) {
  return apiRequest<ApiProjectGroup>(
    `/projects/${projectId}/groups/${groupId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export async function deleteProjectGroup(
  token: string,
  projectId: string,
  groupId: string,
) {
  return apiRequest<{ ok: true }>(
    `/projects/${projectId}/groups/${groupId}`,
    { method: "DELETE" },
    token,
  );
}

export async function listProjectCycles(token: string, projectId: string) {
  return apiRequest<ApiProjectCycle[]>(
    `/projects/${projectId}/cycles`,
    {},
    token,
  );
}

export async function createProjectCycle(
  token: string,
  projectId: string,
  payload: ProjectCycleInput,
) {
  return apiRequest<ApiProjectCycle>(
    `/projects/${projectId}/cycles`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function updateProjectCycle(
  token: string,
  projectId: string,
  cycleId: string,
  payload: Partial<ProjectCycleInput>,
) {
  return apiRequest<ApiProjectCycle>(
    `/projects/${projectId}/cycles/${cycleId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export async function deleteProjectCycle(
  token: string,
  projectId: string,
  cycleId: string,
) {
  return apiRequest<{ ok: true }>(
    `/projects/${projectId}/cycles/${cycleId}`,
    { method: "DELETE" },
    token,
  );
}

export async function listProjectEnrollments(
  token: string,
  projectId: string,
  params?: {
    q?: string;
    status?: string;
    groupId?: string;
    cycleId?: string;
    excludeGroupId?: string;
    excludeCycleId?: string;
    page?: number;
    limit?: number;
  },
) {
  const query = buildQuery(params);
  return apiRequest<ProjectEnrollmentsListResponse>(
    `/projects/${projectId}/enrollments${query}`,
    {},
    token,
  );
}

export async function createProjectEnrollment(
  token: string,
  projectId: string,
  payload: ProjectEnrollmentInput,
) {
  return apiRequest<ApiProjectEnrollment>(
    `/projects/${projectId}/enrollments`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function updateProjectEnrollment(
  token: string,
  projectId: string,
  enrollmentId: string,
  payload: Partial<ProjectEnrollmentInput>,
) {
  return apiRequest<ApiProjectEnrollment>(
    `/projects/${projectId}/enrollments/${enrollmentId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export async function deleteProjectEnrollment(
  token: string,
  projectId: string,
  enrollmentId: string,
) {
  return apiRequest<{ ok: true }>(
    `/projects/${projectId}/enrollments/${enrollmentId}`,
    { method: "DELETE" },
    token,
  );
}

export async function addEnrollmentToGroup(
  token: string,
  projectId: string,
  enrollmentId: string,
  payload: EnrollmentGroupInput,
) {
  return apiRequest<{ ok: true }>(
    `/projects/${projectId}/enrollments/${enrollmentId}/groups`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function removeEnrollmentFromGroup(
  token: string,
  projectId: string,
  enrollmentId: string,
  groupId: string,
) {
  return apiRequest<{ ok: true }>(
    `/projects/${projectId}/enrollments/${enrollmentId}/groups/${groupId}`,
    { method: "DELETE" },
    token,
  );
}

export async function setEnrollmentCycle(
  token: string,
  projectId: string,
  enrollmentId: string,
  payload: EnrollmentCycleInput,
) {
  return apiRequest<{ ok: true }>(
    `/projects/${projectId}/enrollments/${enrollmentId}/cycle`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}
