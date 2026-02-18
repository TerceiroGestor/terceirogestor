"use client";

import * as React from "react";
import { SectionCard } from "@/components/section-card";
import { SectionList, SectionListItem } from "@/components/section-list";
import { Badge } from "@/components/ui/badge";
import { AdminSettingsHeader } from "@/modules/core/features/settings/ui/admin-settings-header";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  RBAC_MODULE_ACTIONS,
  RBAC_MODULE_LABELS,
  splitPermissionKey,
} from "@/features/admin/config/rbac.constants";
import {
  listPermissions,
  listRoles,
  type PermissionSummary,
  type RoleSummary,
} from "@/features/admin/api";

const groupPermissions = (permissions: PermissionSummary[]) => {
  const groups = new Map<
    string,
    { label: string; items: PermissionSummary[] }
  >();
  permissions.forEach((permission) => {
    const parsed = splitPermissionKey(permission.key);
    const moduleKey = parsed?.moduleKey ?? "outros";
    const label = RBAC_MODULE_LABELS[moduleKey] ?? moduleKey;
    const current = groups.get(moduleKey) ?? { label, items: [] };
    current.items.push(permission);
    groups.set(moduleKey, current);
  });
  return Array.from(groups.entries())
    .map(([moduleKey, group]) => ({
      moduleKey,
      label: group.label,
      items: group.items.sort((a, b) => a.key.localeCompare(b.key)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

const buildRoleModules = (role: RoleSummary) => {
  const permissionSet = new Set(
    role.permissions.map((permission) => permission.key),
  );
  return Object.entries(RBAC_MODULE_ACTIONS).map(([moduleKey, module]) => {
    const allowed = module.actions.filter((action) =>
      permissionSet.has(`${moduleKey}.${action}`),
    );
    return {
      moduleKey,
      label: module.label,
      allowed,
    };
  });
};

export default function AdminPermissionsPage() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const [data, setData] = React.useState<PermissionSummary[]>([]);
  const [roles, setRoles] = React.useState<RoleSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const canManage = permissions.includes("roles.manage");

  React.useEffect(() => {
    if (authLoading) return;
    if (!token || !isAuthenticated) {
      setLoading(false);
      return;
    }
    if (!canManage) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [rolesResponse, permissionsResponse] = await Promise.all([
          listRoles(token),
          listPermissions(token),
        ]);
        setRoles(rolesResponse);
        setData(permissionsResponse);
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao carregar permissões.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, token, isAuthenticated, canManage]);

  if (!canManage) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Você não tem permissão para acessar esta área.
      </div>
    );
  }

  const grouped = groupPermissions(data);

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <SectionCard
        title="Perfis por módulo"
        subtitle="Visualize o que cada perfil pode executar em cada módulo."
      >
        <SectionList>
          {roles.map((role) => {
            const modules = buildRoleModules(role);
            return (
              <SectionListItem
                key={role.id}
                title={role.name}
                subtitle={role.description ?? "Sem descrição"}
                meta={
                  <div className="flex flex-col gap-2">
                    {modules.map((module) => (
                      <div
                        key={module.moduleKey}
                        className="flex flex-wrap items-center gap-2 text-xs"
                      >
                        <span className="text-xs font-semibold text-foreground">
                          {module.label}
                        </span>
                        {module.allowed.length ? (
                          module.allowed.map((action) => (
                            <Badge
                              key={`${module.moduleKey}-${action}`}
                              variant="outline"
                            >
                              {action}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">Desativado</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                }
              />
            );
          })}
        </SectionList>
        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Permissões por módulo"
        subtitle="Visão agrupada das permissões disponíveis."
      >
        <SectionList>
          {grouped.map((group) => (
            <SectionListItem
              key={group.moduleKey}
              title={group.label}
              subtitle={`${group.items.length} permissões`}
              meta={
                <div className="flex flex-wrap gap-1">
                  {group.items.map((permission) => (
                    <Badge key={permission.id} variant="outline">
                      {permission.key}
                    </Badge>
                  ))}
                </div>
              }
            />
          ))}
        </SectionList>
      </SectionCard>
    </div>
  );
}
