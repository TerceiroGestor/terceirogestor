import type { LucideIcon } from "lucide-react";

export type ModuleNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  exact?: boolean;
  permissions?: string[];
};

export type ModuleManifest = {
  key: string;
  groupLabel: string;
  navItems: ModuleNavItem[];
};

export type NavGroup = {
  label: string;
  items: ModuleNavItem[];
};

