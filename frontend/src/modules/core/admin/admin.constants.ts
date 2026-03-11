"use client";

export const ADMIN_ROUTES = {
  overview: "/settings",
  institution: "/admin/tenant",
  users: "/admin/users",
  usersNew: "/admin/users/new",
  roles: "/admin/roles",
  rolesNew: "/admin/roles/new",
  permissions: "/admin/permissions",
  audit: "/admin/audit-logs",
} as const;

export const ADMIN_ACTION_IDS = {
  overview: "admin.settings.overview",
  institution: "admin.tenant.detail",
  usersList: "admin.users.list",
  usersDetail: "admin.users.detail",
  usersCreate: "admin.users.create",
  rolesList: "admin.roles.list",
  rolesDetail: "admin.roles.detail",
  rolesCreate: "admin.roles.create",
  permissionsList: "admin.permissions.list",
  auditList: "admin.audit.list",
} as const;

export const ADMIN_USER_STATUS_OPTIONS = [
  { value: "true", label: "Ativo" },
  { value: "false", label: "Inativo" },
] as const;

export const ADMIN_AUDIT_ACTION_OPTIONS = [
  { value: "CREATE", label: "Criado" },
  { value: "UPDATE", label: "Atualizado" },
  { value: "DELETE", label: "Excluido" },
] as const;
