"use client";

import { apiRequest, buildQuery } from "@/lib/api";
import type {
  ApiActivity,
  ProjectActionAttachmentInput,
  ProjectActionCommentInput,
  ActivityInput,
  ActivitiesListResponse,
} from "./types";

export async function listActivities(
  token: string,
  projectId: string,
  params?: {
    q?: string;
    mine?: boolean;
    status?: string;
    actionTypeId?: string;
    peopleGroupId?: string;
    targetEnrollmentId?: string;
    page?: number;
    limit?: number;
  },
) {
  const query = buildQuery(params);
  return apiRequest<ActivitiesListResponse>(
    `/projects/${projectId}/actions${query}`,
    {},
    token,
  );
}

export async function listActions(
  token: string,
  params?: {
    q?: string;
    mine?: boolean;
    status?: string;
    actionTypeId?: string;
    projectId?: string;
    peopleGroupId?: string;
    targetEnrollmentId?: string;
    page?: number;
    limit?: number;
    all?: boolean;
  },
) {
  const query = buildQuery(params);
  return apiRequest<ActivitiesListResponse>(`/actions${query}`, {}, token);
}

export async function getActivity(
  token: string,
  projectId: string,
  actionId: string,
) {
  return apiRequest<ApiActivity>(
    `/projects/${projectId}/actions/${actionId}`,
    {},
    token,
  );
}

export async function createActivity(
  token: string,
  projectId: string,
  payload: ActivityInput,
) {
  return apiRequest<ApiActivity>(
    `/projects/${projectId}/actions`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function updateActivity(
  token: string,
  projectId: string,
  actionId: string,
  payload: Partial<ActivityInput>,
) {
  return apiRequest<ApiActivity>(
    `/projects/${projectId}/actions/${actionId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export async function deleteActivity(
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

export async function addProjectActionComment(
  token: string,
  projectId: string,
  actionId: string,
  payload: ProjectActionCommentInput,
) {
  return apiRequest<ApiActivity>(
    `/projects/${projectId}/actions/${actionId}/comments`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function deleteProjectActionComment(
  token: string,
  projectId: string,
  actionId: string,
  commentId: string,
) {
  return apiRequest<ApiActivity>(
    `/projects/${projectId}/actions/${actionId}/comments/${commentId}`,
    { method: "DELETE" },
    token,
  );
}

export async function addProjectActionAttachment(
  token: string,
  projectId: string,
  actionId: string,
  payload: ProjectActionAttachmentInput,
) {
  return apiRequest<ApiActivity>(
    `/projects/${projectId}/actions/${actionId}/attachments`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function deleteProjectActionAttachment(
  token: string,
  projectId: string,
  actionId: string,
  attachmentId: string,
) {
  return apiRequest<ApiActivity>(
    `/projects/${projectId}/actions/${actionId}/attachments/${attachmentId}`,
    { method: "DELETE" },
    token,
  );
}
