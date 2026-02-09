"use client";

import * as React from "react";
import { SectionCard } from "@/components/section-card";
import { SectionList, SectionListItem } from "@/components/section-list";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { listPermissions, type PermissionSummary } from "@/features/admin/api";

const groupPermissions = (permissions: PermissionSummary[]) => {
  const groups = new Map<string, PermissionSummary[]>();
  permissions.forEach((permission) => {
    const feature = permission.key.split(".")[0] || "outros";
    const label = feature.toLowerCase();
    const current = groups.get(label) ?? [];
    current.push(permission);
    groups.set(label, current);
  });
  return Array.from(groups.entries()).map(([feature, items]) => ({
    feature,
    items: items.sort((a, b) => a.key.localeCompare(b.key)),
  }));
};

export default function AdminPermissionsPage() {
  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const [data, setData] = React.useState<PermissionSummary[]>([]);
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
        const response = await listPermissions(token);
        setData(response);
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao carregar permissoes.";
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
        Voce nao tem permissao para acessar esta area.
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
        title="Permissoes por feature"
        subtitle="Visao agrupada das permissoes disponíveis."
      >
        <SectionList>
          {grouped.map((group) => (
            <SectionListItem
              key={group.feature}
              title={group.feature.toUpperCase()}
              subtitle={`${group.items.length} permissoes`}
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
        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : null}
      </SectionCard>
    </div>
  );
}
