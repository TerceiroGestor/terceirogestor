import { apiRequest, buildQuery } from "@/lib/api";
import type { ApiPerson, PeopleListResponse, PersonInput } from "./types";

export async function listPeople(
  token: string,
  params?: {
    q?: string;
    page?: number;
    limit?: number;
    all?: boolean;
    filters?: string;
    groupBy?: string;
  },
) {
  const query = buildQuery(params);
  return apiRequest<PeopleListResponse>(`/people${query}`, {}, token);
}

export async function getPerson(token: string, id: string) {
  return apiRequest<ApiPerson>(`/people/${id}`, {}, token);
}

export async function createPerson(token: string, payload: PersonInput) {
  return apiRequest<ApiPerson>(
    "/people",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updatePerson(
  token: string,
  id: string,
  payload: PersonInput,
) {
  return apiRequest<ApiPerson>(
    `/people/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function deletePerson(token: string, id: string) {
  return apiRequest<{ deleted: boolean }>(
    `/people/${id}`,
    {
      method: "DELETE",
    },
    token,
  );
}

