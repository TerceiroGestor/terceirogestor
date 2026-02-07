import {
  BarChart3,
  Calendar,
  Cog,
  CreditCard,
  FileText,
  Home,
  Inbox,
  Users,
  Table,
  FormIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  exact?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Análises",
    items: [{ title: "Visão Geral", href: "/", icon: Home, exact: true }],
  },
  {
    label: "Móduloes",
    items: [{ title: "Pessoas", href: "/people", icon: Users }],
  },
  {
    label: "Configurações",
    items: [{ title: "Users", href: "/billing", icon: CreditCard }],
  },
];
