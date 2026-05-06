import { apiRequest } from "@/lib/api";

export type ApiTenant = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  cnpj: string | null;
  startYear: number | null;
  description: string | null;
  status: string;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TenantUpdateInput = {
  name?: string;
  cnpj?: string;
  logoUrl?: string;
  startYear?: number;
  description?: string;
  onboardingCompletedAt?: string;
};

export async function getTenant(token: string) {
  return apiRequest<ApiTenant>("/tenants/me", {}, token);
}

export async function updateTenant(token: string, payload: TenantUpdateInput) {
  return apiRequest<ApiTenant>(
    "/tenants/me",
    { method: "PATCH", body: JSON.stringify(payload) },
    token,
  );
}
