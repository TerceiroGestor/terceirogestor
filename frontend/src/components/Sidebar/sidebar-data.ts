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
    label: "Main",
    items: [
      { title: "Overview", href: "/", icon: Home, exact: true },
      { title: "Analytics", href: "/analytics", icon: BarChart3 },
      { title: "Calendar", href: "/calendar", icon: Calendar, badge: "2" },
      { title: "Table", href: "/table", icon: Table },
      { title: "Form", href: "/form", icon: FormIcon },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Pessoas", href: "/people", icon: Users },
      { title: "Team", href: "/team", icon: Users },
      { title: "Inbox", href: "/inbox", icon: Inbox, badge: "4" },
      { title: "Documents", href: "/documents", icon: FileText },
    ],
  },
  {
    label: "Settings",
    items: [
      { title: "Billing", href: "/billing", icon: CreditCard },
      { title: "Preferences", href: "/settings", icon: Cog },
    ],
  },
];
