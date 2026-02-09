"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/section-card";
import { SectionList, SectionListItem } from "@/components/section-list";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  listPermissions,
  listRoles,
  type PermissionSummary,
  type RoleSummary,
} from "@/features/admin/api";

export default function AdminRolesPage() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const [roles, setRoles] = React.useState<RoleSummary[]>([]);
  const [allPermissions, setAllPermissions] = React.useState<
    PermissionSummary[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const canManageRoles = permissions.includes("roles.manage");

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
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [rolesResponse, permissionsResponse] = await Promise.all([
          listRoles(token),
          listPermissions(token),
        ]);
        setRoles(rolesResponse);
        setAllPermissions(permissionsResponse);
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao carregar perfis.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, token, isAuthenticated, canManageRoles]);

  if (!canManageRoles) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Voce nao tem permissao para acessar esta area.
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
        title="Perfis e permissoes"
        subtitle="Visao geral dos perfis cadastrados e permissoes associadas."
      >
        <SectionList>
          {roles.map((role) => (
            <SectionListItem
              key={role.id}
              title={role.name}
              subtitle={role.description ?? ""}
              meta={
                <div className="flex flex-wrap gap-1">
                  {role.permissions.length ? (
                    role.permissions.map((permission) => (
                      <Badge key={permission.id} variant="outline">
                        {permission.key}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      Sem permissoes
                    </span>
                  )}
                </div>
              }
            />
          ))}
        </SectionList>
        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Permissoes disponiveis"
        subtitle="Lista completa de permissoes do sistema."
      >
        <div className="flex flex-wrap gap-2">
          {allPermissions.map((permission) => (
            <Badge key={permission.id} variant="secondary">
              {permission.key}
            </Badge>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
