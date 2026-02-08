"use client";

import { apiRequest, buildQuery } from "@/lib/api";

export type ApiPerson = {
  id: string;
  tenantId: string;
  fullName: string;
  socialName: string | null;
  birthDate: string | null;
  sex: string | null;
  gender: string | null;
  raceColor: string | null;
  maritalStatus: string | null;
  nationality: string | null;
  email: string | null;
  phone: string | null;
  document: string | null;
  rg: string | null;
  nis: string | null;
  status: string | null;
  departureReason: string | null;
  notes: string | null;
  tags: string[] | null;
  hasHealthIssue: boolean | null;
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
  sex?: string | null;
  socialName?: string | null;
  gender?: string | null;
  raceColor?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  email?: string | null;
  phone?: string | null;
  document?: string | null;
  rg?: string | null;
  nis?: string | null;
  status?: string | null;
  departureReason?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  hasHealthIssue?: boolean | null;
  profileSummary?: string | null;
  avatarUrl?: string | null;
};

export type ApiPersonSummary = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  birthDate: string | null;
  sex: string | null;
  gender: string | null;
  raceColor: string | null;
  status: string | null;
};

export type ApiHouseholdInfo = {
  id: string;
  name?: string | null;
};

export type ApiHouseholdMember = {
  id: string;
  personId: string;
  role?: string | null;
  isLegalGuardian: boolean;
  isIncomeContributor: boolean;
  isProvider: boolean;
  isDependent: boolean;
  notes?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  person: ApiPersonSummary;
};

export type ApiPersonRelation = {
  id: string;
  personId: string;
  relatedPersonId: string;
  type: string;
  livesTogether: boolean;
  isLegalGuardian: boolean;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  relatedPerson: ApiPersonSummary;
};

export type ApiPersonRelationsResponse = {
  household?: ApiHouseholdInfo | null;
  householdMembers: ApiHouseholdMember[];
  relations: ApiPersonRelation[];
};

export type ApiPersonIncome = {
  id: string;
  personId: string;
  householdId?: string | null;
  type: string;
  amount: number;
  frequency: string;
  isHouseholdContribution: boolean;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiPersonExpense = {
  id: string;
  personId: string;
  householdId?: string | null;
  type: string;
  amount: number;
  frequency: string;
  isHouseholdExpense: boolean;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiHouseholdProfile = {
  id: string;
  householdId: string;
  type?: string | null;
  condition?: string | null;
  ownership?: string | null;
  areaM2?: number | null;
  rooms?: number | null;
  bathrooms?: number | null;
  notes?: string | null;
};

export type ApiHouseholdAsset = {
  id: string;
  householdId: string;
  category: string;
  item: string;
  quantity?: number | null;
  condition?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiPersonAsset = {
  id: string;
  personId: string;
  category: string;
  item: string;
  quantity?: number | null;
  condition?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiPersonAssetsGroup = {
  person: ApiPersonSummary;
  assets: ApiPersonAsset[];
};

export type ApiFamilyIncomeSummary = {
  totalIncome: number;
  perCapitaIncome: number;
  totalExpenses: number;
  perCapitaExpenses: number;
  benefitsTotal: number;
  pensionTotal: number;
  householdSize: number;
  contributors: string[];
};

export type PersonRelationInput = {
  relatedPersonId: string;
  type: string;
  livesTogether?: boolean;
  isLegalGuardian?: boolean;
  notes?: string | null;
  householdRole?: string | null;
  isIncomeContributor?: boolean;
  isProvider?: boolean;
  isDependent?: boolean;
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

export async function getPersonRelations(token: string, id: string) {
  return apiRequest<ApiPersonRelationsResponse>(
    `/people/${id}/relations`,
    {},
    token,
  );
}

export async function createPersonRelation(
  token: string,
  id: string,
  payload: PersonRelationInput,
) {
  return apiRequest<ApiPersonRelation>(
    `/people/${id}/relations`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updatePersonRelation(
  token: string,
  id: string,
  relationId: string,
  payload: Partial<PersonRelationInput>,
) {
  return apiRequest<ApiPersonRelation>(
    `/people/${id}/relations/${relationId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function deletePersonRelation(
  token: string,
  id: string,
  relationId: string,
) {
  return apiRequest<{ deleted: boolean }>(
    `/people/${id}/relations/${relationId}`,
    {
      method: "DELETE",
    },
    token,
  );
}

export async function getPersonIncomes(token: string, id: string) {
  return apiRequest<ApiPersonIncome[]>(`/people/${id}/incomes`, {}, token);
}

export async function createPersonIncome(
  token: string,
  id: string,
  payload: Omit<ApiPersonIncome, "id" | "personId" | "createdAt" | "updatedAt">,
) {
  return apiRequest<ApiPersonIncome>(
    `/people/${id}/incomes`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updatePersonIncome(
  token: string,
  id: string,
  incomeId: string,
  payload: Partial<
    Omit<ApiPersonIncome, "id" | "personId" | "createdAt" | "updatedAt">
  >,
) {
  return apiRequest<ApiPersonIncome>(
    `/people/${id}/incomes/${incomeId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function deletePersonIncome(
  token: string,
  id: string,
  incomeId: string,
) {
  return apiRequest<{ deleted: boolean }>(
    `/people/${id}/incomes/${incomeId}`,
    {
      method: "DELETE",
    },
    token,
  );
}

export async function getPersonExpenses(token: string, id: string) {
  return apiRequest<ApiPersonExpense[]>(`/people/${id}/expenses`, {}, token);
}

export async function createPersonExpense(
  token: string,
  id: string,
  payload: Omit<ApiPersonExpense, "id" | "personId" | "createdAt" | "updatedAt">,
) {
  return apiRequest<ApiPersonExpense>(
    `/people/${id}/expenses`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updatePersonExpense(
  token: string,
  id: string,
  expenseId: string,
  payload: Partial<
    Omit<ApiPersonExpense, "id" | "personId" | "createdAt" | "updatedAt">
  >,
) {
  return apiRequest<ApiPersonExpense>(
    `/people/${id}/expenses/${expenseId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function deletePersonExpense(
  token: string,
  id: string,
  expenseId: string,
) {
  return apiRequest<{ deleted: boolean }>(
    `/people/${id}/expenses/${expenseId}`,
    {
      method: "DELETE",
    },
    token,
  );
}

export async function getHouseholdProfile(token: string, id: string) {
  return apiRequest<ApiHouseholdProfile | null>(
    `/people/${id}/household-profile`,
    {},
    token,
  );
}

export async function upsertHouseholdProfile(
  token: string,
  id: string,
  payload: Partial<ApiHouseholdProfile>,
) {
  return apiRequest<ApiHouseholdProfile>(
    `/people/${id}/household-profile`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function getFamilyIncomeSummary(token: string, id: string) {
  return apiRequest<ApiFamilyIncomeSummary>(
    `/people/${id}/family-income-summary`,
    {},
    token,
  );
}

export async function getHouseholdAssets(token: string, id: string) {
  return apiRequest<ApiHouseholdAsset[]>(
    `/people/${id}/household-assets`,
    {},
    token,
  );
}

export async function createHouseholdAsset(
  token: string,
  id: string,
  payload: Omit<
    ApiHouseholdAsset,
    "id" | "householdId" | "createdAt" | "updatedAt"
  >,
) {
  return apiRequest<ApiHouseholdAsset>(
    `/people/${id}/household-assets`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updateHouseholdAsset(
  token: string,
  id: string,
  assetId: string,
  payload: Partial<
    Omit<ApiHouseholdAsset, "id" | "householdId" | "createdAt" | "updatedAt">
  >,
) {
  return apiRequest<ApiHouseholdAsset>(
    `/people/${id}/household-assets/${assetId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function deleteHouseholdAsset(
  token: string,
  id: string,
  assetId: string,
) {
  return apiRequest<{ deleted: boolean }>(
    `/people/${id}/household-assets/${assetId}`,
    {
      method: "DELETE",
    },
    token,
  );
}

export async function getPersonAssets(token: string, id: string) {
  return apiRequest<ApiPersonAsset[]>(
    `/people/${id}/person-assets`,
    {},
    token,
  );
}

export async function getHouseholdPersonAssets(token: string, id: string) {
  return apiRequest<ApiPersonAssetsGroup[]>(
    `/people/${id}/household-person-assets`,
    {},
    token,
  );
}

export async function createPersonAsset(
  token: string,
  id: string,
  payload: Omit<ApiPersonAsset, "id" | "personId" | "createdAt" | "updatedAt">,
) {
  return apiRequest<ApiPersonAsset>(
    `/people/${id}/person-assets`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updatePersonAsset(
  token: string,
  id: string,
  assetId: string,
  payload: Partial<
    Omit<ApiPersonAsset, "id" | "personId" | "createdAt" | "updatedAt">
  >,
) {
  return apiRequest<ApiPersonAsset>(
    `/people/${id}/person-assets/${assetId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function deletePersonAsset(
  token: string,
  id: string,
  assetId: string,
) {
  return apiRequest<{ deleted: boolean }>(
    `/people/${id}/person-assets/${assetId}`,
    {
      method: "DELETE",
    },
    token,
  );
}
