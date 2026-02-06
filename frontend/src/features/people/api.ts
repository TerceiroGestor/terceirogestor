"use client";

import { apiRequest, buildQuery } from "@/lib/api";

export type ApiPerson = {
  id: string;
  tenantId: string;
  fullName: string;
  socialName: string | null;
  birthDate: string | null;
  gender: string | null;
  maritalStatus: string | null;
  nationality: string | null;
  email: string | null;
  phone: string | null;
  document: string | null;
  rg: string | null;
  nis: string | null;
  status: string | null;
  notes: string | null;
  profileSummary: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PeopleListResponse = {
  data: ApiPerson[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type PersonInput = {
  fullName?: string;
  birthDate?: string | null;
  socialName?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  email?: string | null;
  phone?: string | null;
  document?: string | null;
  rg?: string | null;
  nis?: string | null;
  status?: string | null;
  notes?: string | null;
  profileSummary?: string | null;
  avatarUrl?: string | null;
};

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
