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

export type AdminAccessLogAction = "LOGIN" | "REFRESH" | "LOGOUT";

export type AdminAccessLog = {
  id: string;
  action: AdminAccessLogAction;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
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

export type AdminAccessLogListResponse = {
  data: AdminAccessLog[];
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

export async function getUserById(token: string, userId: string) {
  return apiRequest<AdminUser>(`/users/${userId}`, {}, token);
}

export async function getUserAccessLogs(
  token: string,
  userId: string,
  params?: {
    page?: number;
    limit?: number;
    action?: AdminAccessLogAction;
    search?: string;
  },
) {
  const query = buildQuery(params);
  return apiRequest<AdminAccessLogListResponse>(
    `/users/${userId}/access-logs${query}`,
    {},
    token,
  );
}

export async function deleteUser(token: string, userId: string) {
  return apiRequest<{ ok: boolean }>(
    `/users/${userId}`,
    { method: "DELETE" },
    token,
  );
}

export async function listRoles(token: string) {
  return apiRequest<RoleSummary[]>("/roles", {}, token);
}

export async function createRole(
  token: string,
  payload: {
    name: string;
    description?: string;
    permissionKeys?: string[];
  },
) {
  return apiRequest<RoleSummary>(
    "/roles",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updateRole(
  token: string,
  roleId: string,
  payload: {
    name?: string;
    description?: string;
    permissionKeys?: string[];
  },
) {
  return apiRequest<RoleSummary>(
    `/roles/${roleId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function deleteRole(token: string, roleId: string) {
  return apiRequest<{ ok: boolean }>(
    `/roles/${roleId}`,
    {
      method: "DELETE",
    },
    token,
  );
}

export async function listPermissions(token: string) {
  return apiRequest<PermissionSummary[]>("/permissions", {}, token);
}
