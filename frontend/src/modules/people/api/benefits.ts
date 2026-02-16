import { apiRequest } from "@/lib/api";
import type { ApiPersonBenefit } from "./types";

export async function getPersonBenefits(token: string, id: string) {
  return apiRequest<ApiPersonBenefit[]>(`/people/${id}/benefits`, {}, token);
}

export async function createPersonBenefit(
  token: string,
  id: string,
  payload: Omit<ApiPersonBenefit, "id" | "personId" | "createdAt" | "updatedAt">,
) {
  return apiRequest<ApiPersonBenefit>(
    `/people/${id}/benefits`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updatePersonBenefit(
  token: string,
  id: string,
  benefitId: string,
  payload: Partial<
    Omit<ApiPersonBenefit, "id" | "personId" | "createdAt" | "updatedAt">
  >,
) {
  return apiRequest<ApiPersonBenefit>(
    `/people/${id}/benefits/${benefitId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function deletePersonBenefit(
  token: string,
  id: string,
  benefitId: string,
) {
  return apiRequest<{ deleted: boolean }>(
    `/people/${id}/benefits/${benefitId}`,
    { method: "DELETE" },
    token,
  );
}

