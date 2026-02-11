"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { SectionCard } from "@/components/section-card";
import { SectionList, SectionListItem } from "@/components/section-list";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";

const settingsLinks = [
  {
    title: "Instituição",
    description: "Logo, CNPJ e dados institucionais.",
    href: "/admin/tenant",
    permission: "tenants.read",
  },
  {
    title: "Usuários",
    description: "Gerencie usuários, perfis e acessos.",
    href: "/admin/users",
    permission: "users.read",
  },
  {
    title: "Perfis",
    description: "Crie e edite perfis com permissões por modulo.",
    href: "/admin/roles",
    permission: "roles.manage",
  },
  {
    title: "Permissões",
    description: "Visão geral das permissões por recursos.",
    href: "/admin/permissions",
    permission: "roles.manage",
  },
  {
    title: "Auditoria",
    description: "Registro de alterações e histórico de dados.",
    href: "/admin/audit-logs",
    permission: "audit.read",
  },
  {
    title: "Perfil",
    description: "Histórico de acessos e dados do usuário.",
    href: "/auth/profile",
  },
];

export default function SettingsPage() {
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading } = useRequireAuth();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  if (isLoading) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const visibleLinks = settingsLinks.filter((link) => {
    if (!link.permission) return true;
    return permissions.includes(link.permission);
  });

  const adminLinks = visibleLinks.filter(
    (link) => link.href !== "/auth/profile",
  );
  const profileLinks = visibleLinks.filter(
    (link) => link.href === "/auth/profile",
  );

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <PageBreadcrumb
        title="Configuracões"
        items={[{ label: "Configuracões", href: "/settings" }]}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Administracao"
          subtitle="Gerencie instituicao, usuarios e permissoes."
        >
          <SectionList>
            {adminLinks.map((link) => (
              <SectionListItem
                key={link.title}
                title={
                  <Link
                    href={withTenantPath(link.href, tenantSlug)}
                    className="text-sm font-semibold text-foreground"
                  >
                    {link.title}
                  </Link>
                }
                subtitle={link.description}
                showActionsOnHover={false}
              />
            ))}
          </SectionList>
        </SectionCard>

        <SectionCard
          title="Perfil"
          subtitle="Acesse seu historico de acessos e dados pessoais."
        >
          <SectionList>
            {profileLinks.map((link) => (
              <SectionListItem
                key={link.title}
                title={
                  <Link
                    href={withTenantPath(link.href, tenantSlug)}
                    className="text-sm font-semibold text-foreground"
                  >
                    {link.title}
                  </Link>
                }
                subtitle={link.description}
                showActionsOnHover={false}
              />
            ))}
          </SectionList>
        </SectionCard>
      </div>
    </div>
  );
}
