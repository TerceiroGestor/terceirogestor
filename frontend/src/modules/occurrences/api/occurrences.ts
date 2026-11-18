import { apiRequest, buildQuery } from "@/lib/api";
import type {
  AddOccurrencePersonInput,
  ApiOccurrence,
  OccurrenceCaseStatus,
  OccurrenceInput,
  OccurrencesListResponse,
} from "./types";

export async function listOccurrences(
  token: string,
  params?: {
    q?: string;
    status?: OccurrenceCaseStatus;
    meetingId?: string;
    page?: number;
    limit?: number;
    all?: boolean;
  },
) {
  const query = buildQuery(params);
  return apiRequest<OccurrencesListResponse>(`/occurrences${query}`, {}, token);
}

export async function getOccurrence(token: string, id: string) {
  return apiRequest<ApiOccurrence>(`/occurrences/${id}`, {}, token);
}

export async function createOccurrence(token: string, payload: OccurrenceInput) {
  return apiRequest<ApiOccurrence>(
    "/occurrences",
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function updateOccurrence(
  token: string,
  id: string,
  payload: Partial<OccurrenceInput>,
) {
  return apiRequest<ApiOccurrence>(
    `/occurrences/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export async function deleteOccurrence(token: string, id: string) {
  return apiRequest<{ success: true }>(`/occurrences/${id}`, { method: "DELETE" }, token);
}

export async function addOccurrencePerson(
  token: string,
  occurrenceId: string,
  payload: AddOccurrencePersonInput,
) {
  return apiRequest<ApiOccurrence>(
    `/occurrences/${occurrenceId}/people`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function removeOccurrencePerson(
  token: string,
  occurrenceId: string,
  linkId: string,
) {
  return apiRequest<ApiOccurrence>(
    `/occurrences/${occurrenceId}/people/${linkId}`,
    { method: "DELETE" },
    token,
  );
}
