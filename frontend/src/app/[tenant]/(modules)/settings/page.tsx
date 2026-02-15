"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { AdminSettingsHeader } from "@/modules/core/features/settings/ui/admin-settings-header";
import { canAccessAdminSettings } from "@/modules/core/features/settings/domain/admin-settings-access";
import { SectionCard } from "@/components/section-card";
import { SectionList, SectionListItem } from "@/components/section-list";
import { RichTextReadonly } from "@/components/ui/richtext/RichTextReadonly";
import * as React from "react";
import { useAuth } from "@/features/auth/auth-context";
import { listRoles, listUsers } from "@/features/admin/api";

export default function SettingsPage() {
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { token } = useAuth();
  const { permissions, tenant } = useCurrentUser();
  const { isAuthenticated, isLoading } = useRequireAuth();

  const canSeeSettings = canAccessAdminSettings(permissions);

  const [usersTotal, setUsersTotal] = React.useState<number | null>(null);
  const [rolesTotal, setRolesTotal] = React.useState<number | null>(null);

  const canReadUsers = permissions.includes("users.read");
  const canManageRoles = permissions.includes("roles.manage");

  React.useEffect(() => {
    if (!token) return;
    let active = true;

    const load = async () => {
      try {
        if (canReadUsers) {
          const users = await listUsers(token, { page: 1, limit: 1 });
          if (active) setUsersTotal(users.pagination.total);
        } else if (active) {
          setUsersTotal(null);
        }

        if (canManageRoles) {
          const roles = await listRoles(token);
          if (active) setRolesTotal(roles.length);
        } else if (active) {
          setRolesTotal(null);
        }
      } catch {
        if (!active) return;
        setUsersTotal(null);
        setRolesTotal(null);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [token, canReadUsers, canManageRoles]);

  if (isLoading) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!canSeeSettings) {
    return (
      <div className="flex flex-col gap-4 px-4 py-4">
        <PageBreadcrumb
          title="Configurações"
          items={[{ label: "Configurações", href: "/settings" }]}
        />
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-semibold">Sem acesso</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Você não tem permissões administrativas para acessar esta área.
          </p>
          <div className="mt-4">
            <Button asChild>
              <Link href={withTenantPath("/dashboard", tenantSlug)}>
                Voltar para o dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <PageBreadcrumb
        title="Configurações"
        items={[{ label: "Configurações", href: "/settings" }]}
      />

      <AdminSettingsHeader />

      <SectionCard
        title="Visão geral"
        subtitle="Informações gerais da instituição e atalhos administrativos."
        actions={
          <Button asChild size="sm">
            <Link href={withTenantPath("/admin/tenant", tenantSlug)}>
              Editar instituição
            </Link>
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-xs text-muted-foreground">Slug</p>
            <p className="mt-1 font-mono text-sm">{tenant?.slug ?? "-"}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="mt-1 text-sm font-semibold">{tenant?.status ?? "-"}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-xs text-muted-foreground">CNPJ</p>
            <p className="mt-1 text-sm">{tenant?.cnpj ?? "-"}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-xs text-muted-foreground">Ano de início</p>
            <p className="mt-1 text-sm">{tenant?.startYear ?? "-"}</p>
          </div>
        </div>

        <SectionList className="pt-2">
          {canReadUsers ? (
            <SectionListItem
              title="Usuários cadastrados"
              subtitle="Total de usuários cadastrados na instituição."
              meta={<span className="font-mono">{usersTotal ?? "-"}</span>}
              showActionsOnHover={false}
            />
          ) : null}
          {canManageRoles ? (
            <SectionListItem
              title="Perfis de acesso"
              subtitle="Total de perfis configurados na instituição."
              meta={<span className="font-mono">{rolesTotal ?? "-"}</span>}
              showActionsOnHover={false}
            />
          ) : null}
        </SectionList>

        <div>
          <p className="text-xs font-semibold text-foreground">Descrição</p>
          {tenant?.description ? (
            <div className="mt-2">
              <RichTextReadonly
                value={tenant.description}
                bodyClassName="max-h-[420px]"
              />
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Nenhuma descrição cadastrada.
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
