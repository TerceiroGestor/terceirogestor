"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DataTable } from "@/components/DataTable";
import { SectionCard } from "@/components/section-card";
import { SectionDialog } from "@/components/section-dialog";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import {
  RBAC_ACTION_LABELS,
  RBAC_ACTION_ORDER,
  RBAC_MODULE_LABELS,
  splitPermissionKey,
} from "@/features/admin/config/rbac.constants";
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

type RoleRow = {
  id: string;
  name: string;
  description?: string | null;
  modules: string[];
  permissionsCount: number;
};

const buildModulesFromPermissions = (permissions: PermissionSummary[]) => {
  const moduleMap = new Map<string, Set<string>>();
  permissions.forEach((permission) => {
    const parsed = splitPermissionKey(permission.key);
    if (!parsed) return;
    const { moduleKey, action } = parsed;
    const actions = moduleMap.get(moduleKey) ?? new Set<string>();
    actions.add(action);
    moduleMap.set(moduleKey, actions);
  });

  return Array.from(moduleMap.entries())
    .map(([key, actions]) => ({
      key,
      label: RBAC_MODULE_LABELS[key] ?? key,
      actions: Array.from(actions),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

const buildRoleRows = (roles: RoleSummary[]): RoleRow[] =>
  roles.map((role) => {
    const moduleKeys = new Set<string>();
    for (const permission of role.permissions) {
      const parsed = splitPermissionKey(permission.key);
      if (parsed?.moduleKey) moduleKeys.add(parsed.moduleKey);
    }

    const modules = Array.from(moduleKeys)
      .map((key) => RBAC_MODULE_LABELS[key] ?? key)
      .sort((a, b) => a.localeCompare(b));

    return {
      id: role.id,
      name: role.name,
      description: role.description ?? null,
      modules,
      permissionsCount: role.permissions.length,
    };
  });

export default function AdminRolesPage() {
  const { token } = useAuth();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
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
  const [moduleSearch, setModuleSearch] = React.useState("");

  const canManageRoles = permissions.includes("roles.manage");

  const modules = React.useMemo(
    () => buildModulesFromPermissions(permissionsList),
    [permissionsList],
  );
  const rows = React.useMemo(() => buildRoleRows(roles), [roles]);

  const columns = React.useMemo<ColumnDef<RoleRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Perfil",
        cell: ({ row }) => (
          <div className="min-w-[240px]">
            <p className="text-sm font-semibold text-foreground">
              {row.original.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.original.description?.trim()
                ? row.original.description
                : "-"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "modules",
        header: "Módulos",
        cell: ({ row }) => {
          const modules = row.original.modules;
          const visible = modules.slice(0, 4);
          const extra = modules.length - visible.length;
          return (
            <div className="flex flex-wrap gap-1.5">
              {visible.map((module) => (
                <Badge key={module} variant="outline">
                  {module}
                </Badge>
              ))}
              {extra > 0 ? <Badge variant="outline">+{extra}</Badge> : null}
            </div>
          );
        },
      },
      {
        accessorKey: "permissionsCount",
        header: "Permissões",
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.permissionsCount}
          </span>
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
    setModuleSearch("");
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
    setModuleSearch("");
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
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <SectionCard
        title="Perfis"
        subtitle="Crie perfis e edite permissões. Para uma visão por módulo, use a página de permissões."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={withTenantPath("/admin/permissions", tenantSlug)}>
                Ver matriz por módulo
              </Link>
            </Button>
            <Button onClick={openCreate}>Novo perfil</Button>
          </div>
        }
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
              onSelect: (row) => openEdit((row as RoleRow).id),
            },
            {
              id: "delete",
              label: "Excluir perfil",
              destructive: true,
              onSelect: async (row) => {
                const roleId = (row as RoleRow).id;
                const roleName = (row as RoleRow).name;
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
              Módulos e permissões
            </p>

            <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 space-y-4">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                <Input
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                  placeholder="Pesquisa rápida por palavra-chave (módulo)"
                />
                <div className="text-xs text-muted-foreground sm:text-right">
                  {modules.length} módulos
                </div>
              </div>

              <div className="max-h-[52vh] overflow-auto rounded-xl border border-border/60 bg-background/60">
                <table className="w-full min-w-[780px] text-sm">
                  <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/60">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Módulo
                      </th>
                      {RBAC_ACTION_ORDER.map((action) => (
                        <th
                          key={action}
                          className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap"
                        >
                          {RBAC_ACTION_LABELS[action] ?? action}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {modules
                      .filter((module) => {
                        const query = moduleSearch.trim().toLowerCase();
                        if (!query) return true;
                        return (
                          module.label.toLowerCase().includes(query) ||
                          module.key.toLowerCase().includes(query)
                        );
                      })
                      .map((module) => (
                        <tr
                          key={module.key}
                          className="border-b border-border/40 hover:bg-muted/30"
                        >
                          <td className="px-4 py-3 align-middle">
                            <div className="min-w-[220px]">
                              <p className="text-sm font-semibold text-foreground">
                                {module.label}
                              </p>
                              <p className="text-[11px] text-muted-foreground font-mono">
                                {module.key}
                              </p>
                            </div>
                          </td>

                          {RBAC_ACTION_ORDER.map((action) => {
                            const key = `${module.key}.${action}`;
                            const allowed = module.actions.includes(action);
                            const checked = selectedPermissions.has(key);
                            return (
                              <td
                                key={key}
                                className="px-3 py-3 text-center align-middle"
                              >
                                {allowed ? (
                                  <div className="inline-flex items-center justify-center">
                                    <Switch
                                      checked={checked}
                                      onCheckedChange={(next) =>
                                        togglePermission(key, next)
                                      }
                                      aria-label={`${module.label} - ${RBAC_ACTION_LABELS[action] ?? action}`}
                                    />
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    -
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
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
              {editingRole ? "Salvar alterações" : "Criar perfil"}
            </Button>
          </div>
        </form>
      </SectionDialog>
    </div>
  );
}
