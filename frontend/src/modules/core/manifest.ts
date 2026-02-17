import { Home, Settings } from "lucide-react";
import type { ModuleManifest } from "@/modules/types";
import {
  ADMIN_SETTINGS_PERMISSIONS,
} from "@/modules/core/features/settings/domain/admin-settings-access";

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
    },
  ],
};
