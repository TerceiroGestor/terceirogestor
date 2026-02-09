import { apiRequest, buildQuery } from "@/lib/api";

export type AdminUserRole = {
  id: string;
  name: string;
  description?: string | null;
};

export type AdminUser = {
  id: string;
  name?: string | null;
  email: string;
  avatarUrl?: string | null;
  isActive: boolean;
  roles: AdminUserRole[];
  createdAt: string;
  updatedAt: string;
};

export type AdminUserListResponse = {
  data: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type RolePermission = {
  id: string;
  key: string;
  description?: string | null;
};

export type RoleSummary = {
  id: string;
  name: string;
  description?: string | null;
  permissions: RolePermission[];
  createdAt: string;
  updatedAt: string;
};

export type PermissionSummary = {
  id: string;
  key: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function listUsers(
  token: string,
  params?: { page?: number; limit?: number; search?: string },
) {
  const query = buildQuery(params);
  return apiRequest<AdminUserListResponse>(`/users${query}`, {}, token);
}

export async function createUser(
  token: string,
  payload: {
    name: string;
    email: string;
    password: string;
    isActive?: boolean;
    roleIds?: string[];
  },
) {
  return apiRequest<AdminUser>(
    "/users",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updateUser(
  token: string,
  userId: string,
  payload: {
    name?: string;
    email?: string;
    password?: string;
    isActive?: boolean;
    roleIds?: string[];
  },
) {
  return apiRequest<AdminUser>(
    `/users/${userId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function listRoles(token: string) {
  return apiRequest<RoleSummary[]>("/roles", {}, token);
}

export async function listPermissions(token: string) {
  return apiRequest<PermissionSummary[]>("/permissions", {}, token);
}
