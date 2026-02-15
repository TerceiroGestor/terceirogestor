import { apiRequest } from "@/lib/api";
import type {
  ApiFamilyIncomeSummary,
  ApiFamilySummary,
  ApiHouseholdTransfer,
  ApiPersonExpense,
  ApiPersonIncome,
} from "./types";

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

export async function getPersonTransfers(token: string, id: string) {
  return apiRequest<ApiHouseholdTransfer[]>(
    `/people/${id}/transfers`,
    {},
    token,
  );
}

export async function createPersonTransfer(
  token: string,
  id: string,
  payload: Omit<
    ApiHouseholdTransfer,
    "id" | "personId" | "createdAt" | "updatedAt"
  >,
) {
  return apiRequest<ApiHouseholdTransfer>(
    `/people/${id}/transfers`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updatePersonTransfer(
  token: string,
  id: string,
  transferId: string,
  payload: Partial<
    Omit<ApiHouseholdTransfer, "id" | "personId" | "createdAt" | "updatedAt">
  >,
) {
  return apiRequest<ApiHouseholdTransfer>(
    `/people/${id}/transfers/${transferId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function deletePersonTransfer(
  token: string,
  id: string,
  transferId: string,
) {
  return apiRequest<{ deleted: boolean }>(
    `/people/${id}/transfers/${transferId}`,
    {
      method: "DELETE",
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

export async function getFamilySummary(token: string, id: string) {
  return apiRequest<ApiFamilySummary>(`/people/${id}/family-summary`, {}, token);
}

