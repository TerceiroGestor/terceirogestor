"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/DataTable";
import { SectionCard } from "@/components/section-card";
import { SectionDialog } from "@/components/section-dialog";
import { SectionList, SectionListItem } from "@/components/section-list";
import { AdminSettingsHeader } from "@/modules/core/features/settings/ui/admin-settings-header";
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
};

const ACTION_ORDER = ["read", "create", "update", "delete", "manage"];

const ACTION_LABELS: Record<string, string> = {
  read: "Visualizar",
  create: "Criar",
  update: "Atualizar",
  delete: "Remover",
  manage: "Gerenciar",
};

const MODULE_LABELS: Record<string, string> = {
  people: "Pessoas",
  "people.sensitive": "Pessoas • Dados sensíveis (LGPD)",
  pantry: "Despensa",
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
    const parts = permission.key.split(".");
    if (parts.length < 2) return;
    const action = parts[parts.length - 1];
    const moduleKey = parts.slice(0, -1).join(".");
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

const buildRoleRows = (roles: RoleSummary[], modules: ModuleDefinition[]) =>
  roles.flatMap((role) => {
    const permissionSet = new Set(
      role.permissions.map((permission) => permission.key),
    );
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

export default function AdminRolesPage() {
  const { token } = useAuth();
  const { permissions, refresh: refreshCurrentUser } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const [roles, setRoles] = React.useState<RoleSummary[]>([]);
  const [permissionsList, setPermissionsList] = React.useState<
    PermissionSummary[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<RoleSummary | null>(
    null,
  );
  const [formValues, setFormValues] = React.useState<RoleFormValues>({
    name: "",
  });
  const [selectedPermissions, setSelectedPermissions] = React.useState<
    Set<string>
  >(new Set());

  const canManageRoles = permissions.includes("roles.manage");

  const modules = React.useMemo(
    () => buildModulesFromPermissions(permissionsList),
    [permissionsList],
  );
  const rows = React.useMemo(
    () => buildRoleRows(roles, modules),
    [roles, modules],
  );

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
          <span className="text-sm text-muted-foreground">
            {row.original.moduleLabel}
          </span>
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
    setFormValues({ name: "", description: "" });
    setSelectedPermissions(new Set());
    setDialogOpen(true);
  };

  const openEdit = (roleId: string) => {
    const role = roles.find((item) => item.id === roleId) ?? null;
    setEditingRole(role);
    if (role) {
      setFormValues({
        name: role.name,
        description: role.description ?? "",
      });
      setSelectedPermissions(
        new Set(role.permissions.map((permission) => permission.key)),
      );
    }
    setDialogOpen(true);
  };

  const togglePermission = (key: string, checked: boolean) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    const payload = {
      name: formValues.name.trim(),
      description: formValues.description?.trim() || undefined,
      permissionKeys: Array.from(selectedPermissions),
    };

    if (editingRole) {
      await updateRole(token, editingRole.id, payload);
    } else {
      await createRole(token, payload);
    }
    setDialogOpen(false);
    setEditingRole(null);
    await refreshCurrentUser();
    await loadData();
  };

  if (!canManageRoles) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Você não tem permissão para acessar esta área.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <AdminSettingsHeader title="Configurações • Perfis" />

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <SectionCard
        title="Perfis"
        subtitle="Controle os acessos por módulo e ação."
        actions={<Button onClick={openCreate}>Novo perfil</Button>}
      >
        <DataTable
          columns={columns}
          data={rows}
          searchPlaceholder="Pesquisar perfis"
          showExportMenu={false}
          initialColumnPinning={{ left: ["actions"], right: ["canCreate"] }}
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
                await refreshCurrentUser();
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
        contentClassName="max-w-[920px]"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Nome do perfil
              </label>
              <input
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={formValues.name}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="Ex.: Atendimento"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Descricao
              </label>
              <textarea
                className="min-h-[36px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={formValues.description}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Resumo do perfil"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">
              Modulos e permissoes
            </p>
            <SectionList>
              {modules.map((module) => {
                const moduleActions = ACTION_ORDER.filter((action) =>
                  module.actions.includes(action),
                );
                return (
                  <SectionListItem
                    key={module.key}
                    title={module.label}
                    subtitle=""
                    meta={
                      <div className="flex flex-wrap gap-4">
                        {moduleActions.map((action) => {
                          const key = `${module.key}.${action}`;
                          const checked = selectedPermissions.has(key);
                          return (
                            <label
                              key={key}
                              className="flex items-center gap-2 text-xs text-muted-foreground"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(next) =>
                                  togglePermission(key, Boolean(next))
                                }
                              />
                              <span className="text-foreground">
                                {ACTION_LABELS[action] ?? action}
                              </span>
                            </label>
                          );
                        })}
                        {moduleActions.length === 0 ? (
                          <Badge variant="outline">Sem permissoes</Badge>
                        ) : null}
                      </div>
                    }
                    showActionsOnHover={false}
                  />
                );
              })}
            </SectionList>
          </div>

          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setDialogOpen(false);
                setEditingRole(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingRole ? "Salvar alteracoes" : "Criar perfil"}
            </Button>
          </div>
        </form>
      </SectionDialog>
    </div>
  );
}
