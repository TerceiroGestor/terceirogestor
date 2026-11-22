"use client";

import { apiRequest, buildQuery } from "@/lib/api";
import type {
  AddMeetingTeamParticipationInput,
  AddMeetingTeamParticipationResponse,
  ApiMeetingTeamParticipation,
  MeetingInput,
  MeetingUpdateInput,
  MeetingsListResponse,
  ApiMeeting,
  BulkCreateMeetingsInput,
  BulkCreateMeetingsResponse,
  OccurrenceStatus,
  PreviewMeetingsInput,
  PreviewMeetingsResponse,
  UpdateMeetingBatchInput,
} from "./types";

export async function listMeetings(
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
  return apiRequest<MeetingsListResponse>(
    `/projects/${projectId}/actions/${actionId}/occurrences${query}`,
    {},
    token,
  );
}

export async function getMeeting(
  token: string,
  projectId: string,
  actionId: string,
  occurrenceId: string,
) {
  return apiRequest<ApiMeeting>(
    `/projects/${projectId}/actions/${actionId}/occurrences/${occurrenceId}`,
    {},
    token,
  );
}

export async function createMeeting(
  token: string,
  projectId: string,
  actionId: string,
  input: MeetingInput,
) {
  return apiRequest<ApiMeeting>(
    `/projects/${projectId}/actions/${actionId}/occurrences`,
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
}

export async function previewBulkMeetings(
  token: string,
  projectId: string,
  actionId: string,
  input: PreviewMeetingsInput,
) {
  return apiRequest<PreviewMeetingsResponse>(
    `/projects/${projectId}/actions/${actionId}/occurrences/bulk/preview`,
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
}

export async function bulkCreateMeetings(
  token: string,
  projectId: string,
  actionId: string,
  input: BulkCreateMeetingsInput,
) {
  return apiRequest<BulkCreateMeetingsResponse>(
    `/projects/${projectId}/actions/${actionId}/occurrences/bulk`,
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
}

export async function updateMeeting(
  token: string,
  projectId: string,
  actionId: string,
  occurrenceId: string,
  patch: MeetingUpdateInput,
) {
  return apiRequest<ApiMeeting>(
    `/projects/${projectId}/actions/${actionId}/occurrences/${occurrenceId}`,
    { method: "PATCH", body: JSON.stringify(patch) },
    token,
  );
}

export async function updateMeetingBatch(
  token: string,
  projectId: string,
  actionId: string,
  recurrenceBatchId: string,
  patch: UpdateMeetingBatchInput,
) {
  return apiRequest<{ ok: true; updated: number }>(
    `/projects/${projectId}/actions/${actionId}/occurrences/batch/${recurrenceBatchId}`,
    { method: "PATCH", body: JSON.stringify(patch) },
    token,
  );
}

export async function deleteMeeting(
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

export async function listMeetingTeamParticipations(
  token: string,
  projectId: string,
  actionId: string,
  occurrenceId: string,
) {
  return apiRequest<ApiMeetingTeamParticipation[]>(
    `/projects/${projectId}/actions/${actionId}/occurrences/${occurrenceId}/team`,
    {},
    token,
  );
}

export async function addMeetingTeamParticipations(
  token: string,
  projectId: string,
  actionId: string,
  occurrenceId: string,
  input: AddMeetingTeamParticipationInput,
) {
  return apiRequest<AddMeetingTeamParticipationResponse>(
    `/projects/${projectId}/actions/${actionId}/occurrences/${occurrenceId}/team`,
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
}

export async function removeMeetingTeamParticipation(
  token: string,
  projectId: string,
  actionId: string,
  occurrenceId: string,
  participationId: string,
) {
  return apiRequest<{ ok: true }>(
    `/projects/${projectId}/actions/${actionId}/occurrences/${occurrenceId}/team/${participationId}`,
    { method: "DELETE" },
    token,
  );
}
