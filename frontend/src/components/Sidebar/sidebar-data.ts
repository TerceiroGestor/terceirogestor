import { Cog, Home, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  exact?: boolean;
  permissions?: string[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Analises",
    items: [{ title: "Visao Geral", href: "/", icon: Home, exact: true }],
  },
  {
    label: "Modulos",
    items: [{ title: "Pessoas", href: "/people", icon: Users }],
  },
  {
    label: "Administracao",
    items: [
      {
        title: "Usuarios",
        href: "/admin/users",
        icon: Users,
        permissions: ["users.read"],
      },
      {
        title: "Perfis e Permissoes",
        href: "/admin/roles",
        icon: Cog,
        permissions: ["roles.manage"],
      },
    ],
  },
];
