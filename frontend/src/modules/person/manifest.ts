import { Users } from "lucide-react";
import type { ModuleManifest } from "@/modules/types";
import { NAV_GROUPS } from "@/modules/nav/groups";

export const personManifest: ModuleManifest = {
  key: "person",
  groupLabel: NAV_GROUPS.GESTAO,
  navItems: [
    {
      title: "Pessoas",
      href: "/person",
      icon: Users,
      permissions: ["people.read"],
      order: 10,
    },
  ],
};

