"use client";

import Link from "next/link";
import { SectionCard } from "@/components/section-card";
import { SectionList, SectionListItem } from "@/components/section-list";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";

const settingsLinks = [
  {
    title: "Administracao do tenant",
    description: "Logo, nome e dados basicos da instituicao.",
    href: "/admin/tenant",
    permission: "tenants.read",
  },
  {
    title: "Usuarios",
    description: "Gerencie usuarios, perfis e status.",
    href: "/admin/users",
    permission: "users.read",
  },
  {
    title: "Permissoes por feature",
    description: "Visualize permissoes agrupadas por feature.",
    href: "/admin/permissions",
    permission: "roles.manage",
  },
  {
    title: "Perfil do usuario",
    description: "Historico de acessos e configuracoes pessoais.",
    href: "/auth/profile",
  },
];

export default function SettingsPage() {
  const { permissions } = useCurrentUser();
  const { isAuthenticated, isLoading } = useRequireAuth();

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

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <SectionCard
        title="Configuracoes"
        subtitle="Acesse as configuracoes administrativas e do seu perfil."
      >
        <SectionList>
          {visibleLinks.map((link) => (
            <SectionListItem
              key={link.title}
              title={
                <Link
                  href={link.href}
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
  );
}
