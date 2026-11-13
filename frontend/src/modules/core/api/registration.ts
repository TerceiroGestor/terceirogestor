import { publicApiRequest } from "@/lib/api";

export type TenantRegistrationInfo = {
  id: string;
  method: "EMAIL";
  status: "PENDING_VERIFICATION" | "CONFIRMED" | "EXPIRED";
  tenantName: string;
  tenantSlug: string;
  adminEmail: string | null;
  adminName: string | null;
  passwordRequired: boolean;
  codeExpiresAt: string | null;
};

export async function requestTenantRegistration(input: {
  tenantName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}) {
  return publicApiRequest<{ registrationId: string }>(
    "/registration/tenant/request",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function getTenantRegistration(registrationId: string) {
  return publicApiRequest<TenantRegistrationInfo>(
    `/registration/tenant/${encodeURIComponent(registrationId)}`,
  );
}

export async function confirmTenantRegistration(input: {
  registrationId: string;
  code: string;
  password?: string;
}) {
  return publicApiRequest<{ accessToken: string; tenantSlug: string }>(
    "/registration/tenant/confirm",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}
