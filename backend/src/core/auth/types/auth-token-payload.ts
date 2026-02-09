export type AuthTokenPayload = {
  sub: string;
  tenantId: string;
  email: string;
  name?: string | null;
  tenantName?: string | null;
};
