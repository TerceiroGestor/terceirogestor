import { TriangleAlert } from "lucide-react";
import type { ModuleManifest } from "@/modules/types";
import { NAV_GROUPS } from "@/modules/nav/groups";

export const occurrencesManifest: ModuleManifest = {
  key: "occurrences",
  groupLabel: NAV_GROUPS.OPERACOES,
  navItems: [
    {
      title: "Ocorrências",
      href: "/occurrences",
      icon: TriangleAlert,
      permissions: ["occurrences.read"],
      order: 6,
    },
  ],
};
