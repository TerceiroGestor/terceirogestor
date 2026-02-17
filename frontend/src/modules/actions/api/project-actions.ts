"use client";

import { apiRequest, buildQuery } from "@/lib/api";
import type {
  ApiProjectAction,
  ProjectActionInput,
  ProjectActionsListResponse,
} from "./types";

export async function listProjectActions(
  token: string,
  projectId: string,
  params?: {
    q?: string;
    mine?: boolean;
    status?: string;
    actionTypeId?: string;
    groupId?: string;
    cycleId?: string;
    page?: number;
    limit?: number;
  },
) {
  const query = buildQuery(params);
  return apiRequest<ProjectActionsListResponse>(
    `/projects/${projectId}/actions${query}`,
    {},
    token,
  );
}

export async function getProjectAction(
  token: string,
  projectId: string,
  actionId: string,
) {
  return apiRequest<ApiProjectAction>(
    `/projects/${projectId}/actions/${actionId}`,
    {},
    token,
  );
}

export async function createProjectAction(
  token: string,
  projectId: string,
  payload: ProjectActionInput,
) {
  return apiRequest<ApiProjectAction>(
    `/projects/${projectId}/actions`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function updateProjectAction(
  token: string,
  projectId: string,
  actionId: string,
  payload: Partial<ProjectActionInput>,
) {
  return apiRequest<ApiProjectAction>(
    `/projects/${projectId}/actions/${actionId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export async function deleteProjectAction(
  token: string,
  projectId: string,
  actionId: string,
) {
  return apiRequest<{ ok: true }>(
    `/projects/${projectId}/actions/${actionId}`,
    { method: "DELETE" },
    token,
  );
}
