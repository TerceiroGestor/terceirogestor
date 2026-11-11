import { Layers3 } from "lucide-react";
import type { ModuleManifest } from "@/modules/types";
import { NAV_GROUPS } from "@/modules/nav/groups";

export const peopleGroupsManifest: ModuleManifest = {
  key: "people-groups",
  groupLabel: NAV_GROUPS.GESTAO,
  navItems: [
    {
      title: "Grupos de Pessoas",
      href: "/people-groups",
      icon: Layers3,
      permissions: ["people.read"],
      order: 11,
    },
  ],
};
