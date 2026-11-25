import { FolderKanban } from "lucide-react";
import type { ModuleManifest } from "@/modules/types";
import { NAV_GROUPS } from "@/modules/nav/groups";

export const casesManifest: ModuleManifest = {
  key: "cases",
  groupLabel: NAV_GROUPS.OPERACOES,
  navItems: [
    {
      title: "Casos",
      href: "/cases",
      icon: FolderKanban,
      permissions: ["cases.read"],
      order: 9,
    },
  ],
};
