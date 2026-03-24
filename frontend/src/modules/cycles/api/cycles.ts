import { apiRequest, buildQuery } from "@/lib/api";
import type {
  ApiCycle,
  CycleAttachmentInput,
  CycleCommentInput,
  CycleInput,
  CyclesListResponse,
} from "./types";

export async function listCycles(
  token: string,
  params?: {
    q?: string;
    audienceType?: string;
    isActive?: boolean;
    ageMin?: number;
    ageMax?: number;
    page?: number;
    limit?: number;
    all?: boolean;
  },
) {
  const query = buildQuery(params);
  return apiRequest<CyclesListResponse>(`/cycles${query}`, {}, token);
}

export async function getCycle(token: string, id: string) {
  return apiRequest<ApiCycle>(`/cycles/${id}`, {}, token);
}

export async function createCycle(token: string, payload: CycleInput) {
  return apiRequest<ApiCycle>(
    "/cycles",
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function updateCycle(token: string, id: string, payload: Partial<CycleInput>) {
  return apiRequest<ApiCycle>(
    `/cycles/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}

export async function deleteCycle(token: string, id: string) {
  return apiRequest<{ ok: true }>(
    `/cycles/${id}`,
    { method: "DELETE" },
    token,
  );
}

export async function addCycleComment(
  token: string,
  id: string,
  payload: CycleCommentInput,
) {
  return apiRequest<ApiCycle>(
    `/cycles/${id}/comments`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function deleteCycleComment(
  token: string,
  id: string,
  commentId: string,
) {
  return apiRequest<ApiCycle>(
    `/cycles/${id}/comments/${commentId}`,
    { method: "DELETE" },
    token,
  );
}

export async function addCycleAttachment(
  token: string,
  id: string,
  payload: CycleAttachmentInput,
) {
  return apiRequest<ApiCycle>(
    `/cycles/${id}/attachments`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function deleteCycleAttachment(
  token: string,
  id: string,
  attachmentId: string,
) {
  return apiRequest<ApiCycle>(
    `/cycles/${id}/attachments/${attachmentId}`,
    { method: "DELETE" },
    token,
  );
}
