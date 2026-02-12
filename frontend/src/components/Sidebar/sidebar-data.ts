import { Home, Package, Users } from "lucide-react";
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
    items: [{ title: "Painel", href: "/dashboard", icon: Home, exact: true }],
  },
  {
    label: "Módulos",
    items: [
      { title: "Pessoas", href: "/people", icon: Users },
      {
        title: "Despensa",
        href: "/pantry",
        icon: Package,
        permissions: ["pantry.read"],
      },
    ],
  },
];
