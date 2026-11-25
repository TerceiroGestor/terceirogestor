import { apiRequest, buildQuery } from "@/lib/api";
import type {
  AddCasePersonInput,
  ApiCase,
  ApiCaseReport,
  CaseInput,
  CasesListResponse,
  CaseStatus,
} from "./types";

export async function listCases(
  token: string,
  params?: { q?: string; status?: CaseStatus; page?: number; limit?: number; all?: boolean },
) {
  const query = buildQuery(params);
  return apiRequest<CasesListResponse>(`/cases${query}`, {}, token);
}

export async function getCase(token: string, id: string) {
  return apiRequest<ApiCase>(`/cases/${id}`, {}, token);
}

export async function getCaseReport(token: string, id: string) {
  return apiRequest<ApiCaseReport>(`/cases/${id}/report`, {}, token);
}

export async function createCase(token: string, payload: CaseInput) {
  return apiRequest<ApiCase>("/cases", { method: "POST", body: JSON.stringify(payload) }, token);
}

export async function updateCase(token: string, id: string, payload: Partial<CaseInput>) {
  return apiRequest<ApiCase>(`/cases/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, token);
}

export async function deleteCase(token: string, id: string) {
  return apiRequest<{ success: true }>(`/cases/${id}`, { method: "DELETE" }, token);
}

export async function addCasePerson(token: string, caseId: string, payload: AddCasePersonInput) {
  return apiRequest<ApiCase>(
    `/cases/${caseId}/people`,
    { method: "POST", body: JSON.stringify(payload) },
    token,
  );
}

export async function removeCasePerson(token: string, caseId: string, linkId: string) {
  return apiRequest<ApiCase>(`/cases/${caseId}/people/${linkId}`, { method: "DELETE" }, token);
}
