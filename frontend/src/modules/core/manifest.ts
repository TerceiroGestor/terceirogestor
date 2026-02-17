"use client";

import {
  Building2,
  Home,
  Settings,
  Shield,
  ShieldCheck,
  Users,
  ScrollText,
} from "lucide-react";
import type { ModuleManifest } from "@/modules/types";
import { ADMIN_SETTINGS_PERMISSIONS } from "@/modules/core/features/settings/domain/admin-settings-access";

export const coreManifest: ModuleManifest = {
  key: "core",
  groupLabel: "Geral",
  navItems: [
    { title: "Painel", href: "/dashboard", icon: Home, exact: true, order: 10 },
    {
      title: "Configurações",
      href: "/settings",
      icon: Settings,
      groupLabel: "Administração",
      permissionsAny: [...ADMIN_SETTINGS_PERMISSIONS],
      order: 10,
      children: [
        {
          title: "Visão geral",
          href: "/settings",
          icon: Settings,
          permissionsAny: [...ADMIN_SETTINGS_PERMISSIONS],
          order: 10,
          exact: true,
        },
        {
          title: "Instituição",
          href: "/admin/tenant",
          icon: Building2,
          permissionsAny: ["tenants.read", "tenants.update"],
          order: 20,
        },
        {
          title: "Usuários",
          href: "/admin/users",
          icon: Users,
          permissionsAny: ["users.read"],
          order: 30,
        },
        {
          title: "Perfis",
          href: "/admin/roles",
          icon: ShieldCheck,
          permissionsAny: ["roles.manage"],
          order: 40,
        },
        {
          title: "Permissões",
          href: "/admin/permissions",
          icon: Shield,
          permissionsAny: ["roles.manage"],
          order: 50,
        },
        {
          title: "Auditoria",
          href: "/admin/audit-logs",
          icon: ScrollText,
          permissionsAny: ["audit.read"],
          order: 60,
        },
      ],
    },
  ],
};

