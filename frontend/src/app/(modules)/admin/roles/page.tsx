"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import { SectionCard } from "@/components/section-card";
import { SectionDialog } from "@/components/section-dialog";
import { FormEngine } from "@/components/FormEngine";
import type { FormField } from "@/components/FormEngine/types";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  createRole,
  deleteRole,
  listPermissions,
  listRoles,
  updateRole,
  type PermissionSummary,
  type RoleSummary,
} from "@/features/admin/api";

type RoleFormValues = {
  name: string;
  description?: string;
  permissionKeys?: string[];
};

const ACTION_LABELS: Record<string, string> = {
  read: "Visualizar",
  create: "Criar",
  update: "Atualizar",
  delete: "Remover",
  manage: "Gerenciar",
};

const MODULE_LABELS: Record<string, string> = {
  people: "Pessoas",
  users: "Usuarios",
  tenants: "Instituicao",
  roles: "Perfis",
  permissions: "Permissoes",
  financial: "Financeiro",
};

type ModuleDefinition = {
  key: string;
  label: string;
  actions: string[];
};

type RoleModuleRow = {
  id: string;
  roleId: string;
  roleName: string;
  moduleKey: string;
  moduleLabel: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

const buildModulesFromPermissions = (permissions: PermissionSummary[]) => {
  const moduleMap = new Map<string, Set<string>>();
  permissions.forEach((permission) => {
    const [moduleKey, action] = permission.key.split(".");
    if (!moduleKey || !action) return;
    const actions = moduleMap.get(moduleKey) ?? new Set<string>();
    actions.add(action);
    moduleMap.set(moduleKey, actions);
  });

  return Array.from(moduleMap.entries())
    .map(([key, actions]) => ({
      key,
      label: MODULE_LABELS[key] ?? key,
      actions: Array.from(actions),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

const buildPermissionOptions = (permissions: PermissionSummary[]) =>
  permissions.map((permission) => {
    const [moduleKey, action] = permission.key.split(".");
    const moduleLabel = MODULE_LABELS[moduleKey] ?? moduleKey;
    const actionLabel = ACTION_LABELS[action] ?? action;
    return {
      label: `${moduleLabel} - ${actionLabel}`,
      value: permission.key,
    };
  });

const buildRoleRows = (roles: RoleSummary[], modules: ModuleDefinition[]) =>
  roles.flatMap((role) => {
    const permissionSet = new Set(role.permissions.map((permission) => permission.key));
    return modules.map((module) => ({
      id: `${role.id}-${module.key}`,
      roleId: role.id,
      roleName: role.name,
      moduleKey: module.key,
      moduleLabel: module.label,
      canRead: permissionSet.has(`${module.key}.read`),
      canCreate: permissionSet.has(`${module.key}.create`),
      canUpdate: permissionSet.has(`${module.key}.update`),
      canDelete: permissionSet.has(`${module.key}.delete`),
    }));
  });

const buildRoleFields = (options: { label: string; value: string }[]): FormField<RoleFormValues>[] => [
  {
    name: "name",
    label: "Nome do perfil",
    type: "text",
    required: true,
  },
  {
    name: "description",
    label: "Descricao",
    type: "textarea",
    rows: 3,
  },
  {
    name: "permissionKeys",
    label: "Permissoes",
    type: "multiselect",
    options,
  },
];

export default function AdminRolesPage() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const [roles, setRoles] = React.useState<RoleSummary[]>([]);
  const [permissionsList, setPermissionsList] = React.useState<PermissionSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<RoleSummary | null>(null);

  const canManageRoles = permissions.includes("roles.manage");

  const modules = React.useMemo(() => buildModulesFromPermissions(permissionsList), [permissionsList]);
  const rows = React.useMemo(() => buildRoleRows(roles, modules), [roles, modules]);
  const permissionOptions = React.useMemo(() => buildPermissionOptions(permissionsList), [permissionsList]);

  const columns = React.useMemo<ColumnDef<RoleModuleRow>[]>(
    () => [
      {
        accessorKey: "roleName",
        header: "Perfil",
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-foreground">
            {row.original.roleName}
          </span>
        ),
      },
      {
        accessorKey: "moduleLabel",
        header: "Modulo",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.moduleLabel}</span>
        ),
      },
      {
        accessorKey: "canRead",
        header: "Visualizar",
        cell: ({ row }) => (
          <Badge variant={row.original.canRead ? "secondary" : "outline"}>
            {row.original.canRead ? "Sim" : "Nao"}
          </Badge>
        ),
      },
      {
        accessorKey: "canCreate",
        header: "Criar",
        cell: ({ row }) => (
          <Badge variant={row.original.canCreate ? "secondary" : "outline"}>
            {row.original.canCreate ? "Sim" : "Nao"}
          </Badge>
        ),
      },
      {
        accessorKey: "canUpdate",
        header: "Atualizar",
        cell: ({ row }) => (
          <Badge variant={row.original.canUpdate ? "secondary" : "outline"}>
            {row.original.canUpdate ? "Sim" : "Nao"}
          </Badge>
        ),
      },
      {
        accessorKey: "canDelete",
        header: "Remover",
        cell: ({ row }) => (
          <Badge variant={row.original.canDelete ? "secondary" : "outline"}>
            {row.original.canDelete ? "Sim" : "Nao"}
          </Badge>
        ),
      },
    ],
    [],
  );

  const loadData = React.useCallback(async () => {
    if (!token || !canManageRoles) return;
    setLoading(true);
    setError(null);
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        listRoles(token),
        listPermissions(token),
      ]);
      setRoles(rolesResponse);
      setPermissionsList(permissionsResponse);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar perfis.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token, canManageRoles]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!token || !isAuthenticated) {
      setLoading(false);
      return;
    }
    if (!canManageRoles) {
      setLoading(false);
      return;
    }
    loadData();
  }, [authLoading, token, isAuthenticated, canManageRoles, loadData]);

  const openCreate = () => {
    setEditingRole(null);
    setDialogOpen(true);
  };

  const openEdit = (roleId: string) => {
    const role = roles.find((item) => item.id === roleId) ?? null;
    setEditingRole(role);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: RoleFormValues) => {
    if (!token) return;
    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      permissionKeys: values.permissionKeys,
    };

    if (editingRole) {
      await updateRole(token, editingRole.id, payload);
    } else {
      await createRole(token, payload);
    }
    setDialogOpen(false);
    setEditingRole(null);
    await loadData();
  };

  if (!canManageRoles) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Voce nao tem permissao para acessar esta area.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <PageBreadcrumb
        title="Perfis"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Configuracoes", href: "/settings" },
        ]}
      />

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <SectionCard
        title="Perfis"
        subtitle="Controle os acessos por modulo e acao."
        actions={<Button onClick={openCreate}>Novo perfil</Button>}
      >
        <DataTable
          columns={columns}
          data={rows}
          searchPlaceholder="Pesquisar perfis"
          showExportMenu={false}
          rowActions={[
            {
              id: "edit",
              label: "Editar perfil",
              onSelect: (row) => openEdit((row as RoleModuleRow).roleId),
            },
            {
              id: "delete",
              label: "Excluir perfil",
              destructive: true,
              onSelect: async (row) => {
                const roleId = (row as RoleModuleRow).roleId;
                const roleName = (row as RoleModuleRow).roleName;
                if (!token) return;
                const confirmed = window.confirm(
                  `Excluir o perfil ${roleName}?`,
                );
                if (!confirmed) return;
                await deleteRole(token, roleId);
                await loadData();
              },
            },
          ]}
        />
        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : null}
      </SectionCard>

      <SectionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingRole(null);
        }}
        title={editingRole ? "Editar perfil" : "Novo perfil"}
        description={
          editingRole
            ? "Atualize o nome e as permissoes do perfil."
            : "Crie um perfil com permissoes por modulo."
        }
      >
        <FormEngine<RoleFormValues>
          fields={buildRoleFields(permissionOptions)}
          initialValues={
            editingRole
              ? {
                  name: editingRole.name,
                  description: editingRole.description ?? "",
                  permissionKeys: editingRole.permissions.map((permission) => permission.key),
                }
              : { name: "" }
          }
          onSubmit={handleSubmit}
          actions={{
            cancel: {
              label: "Cancelar",
              variant: "ghost",
              onClick: () => {
                setDialogOpen(false);
                setEditingRole(null);
              },
            },
            submit: {
              label: editingRole ? "Salvar alteracoes" : "Criar perfil",
            },
          }}
        />
      </SectionDialog>
    </div>
  );
}
