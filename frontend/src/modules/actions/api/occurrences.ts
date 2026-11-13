"use client";

import { apiRequest, buildQuery } from "@/lib/api";
import type {
  ActionOccurrenceInput,
  ActionOccurrenceUpdateInput,
  ActionOccurrencesListResponse,
  ApiActionOccurrence,
  BulkCreateActionOccurrencesInput,
  BulkCreateActionOccurrencesResponse,
  OccurrenceStatus,
  UpdateActionOccurrenceBatchInput,
} from "./types";

export async function listActionOccurrences(
  token: string,
  projectId: string,
  actionId: string,
  params?: {
    from?: string;
    to?: string;
    status?: OccurrenceStatus;
    peopleGroupId?: string;
    page?: number;
    limit?: number;
  },
) {
  const query = buildQuery(params);
  return apiRequest<ActionOccurrencesListResponse>(
    `/projects/${projectId}/actions/${actionId}/occurrences${query}`,
    {},
    token,
  );
}

export async function createActionOccurrence(
  token: string,
  projectId: string,
  actionId: string,
  input: ActionOccurrenceInput,
) {
  return apiRequest<ApiActionOccurrence>(
    `/projects/${projectId}/actions/${actionId}/occurrences`,
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
}

export async function bulkCreateActionOccurrences(
  token: string,
  projectId: string,
  actionId: string,
  input: BulkCreateActionOccurrencesInput,
) {
  return apiRequest<BulkCreateActionOccurrencesResponse>(
    `/projects/${projectId}/actions/${actionId}/occurrences/bulk`,
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
}

export async function updateActionOccurrence(
  token: string,
  projectId: string,
  actionId: string,
  occurrenceId: string,
  patch: ActionOccurrenceUpdateInput,
) {
  return apiRequest<ApiActionOccurrence>(
    `/projects/${projectId}/actions/${actionId}/occurrences/${occurrenceId}`,
    { method: "PATCH", body: JSON.stringify(patch) },
    token,
  );
}

export async function updateActionOccurrenceBatch(
  token: string,
  projectId: string,
  actionId: string,
  recurrenceBatchId: string,
  patch: UpdateActionOccurrenceBatchInput,
) {
  return apiRequest<{ ok: true; updated: number }>(
    `/projects/${projectId}/actions/${actionId}/occurrences/batch/${recurrenceBatchId}`,
    { method: "PATCH", body: JSON.stringify(patch) },
    token,
  );
}

export async function deleteActionOccurrence(
  token: string,
  projectId: string,
  actionId: string,
  occurrenceId: string,
) {
  return apiRequest<{ ok: true }>(
    `/projects/${projectId}/actions/${actionId}/occurrences/${occurrenceId}`,
    { method: "DELETE" },
    token,
  );
}
