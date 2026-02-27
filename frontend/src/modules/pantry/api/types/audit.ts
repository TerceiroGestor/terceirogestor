export type PantryAuditLogAction = "CREATE" | "UPDATE" | "DELETE";

export type ApiPantryAuditLogUser = {
  id: string;
  name: string | null;
  email: string | null;
};

export type ApiPantryAuditLog = {
  id: string;
  action: PantryAuditLogAction;
  entity: string;
  entityId: string | null;
  before: unknown | null;
  after: unknown | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  userId: string | null;
  createdAt: string;
  user: ApiPantryAuditLogUser | null;
};

export type PantryAuditLogListResponse = {
  data: ApiPantryAuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

