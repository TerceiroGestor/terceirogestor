"use client";

import { Network } from "lucide-react";
import type { ModuleManifest } from "@/modules/types";
import { NAV_GROUPS } from "@/modules/nav/groups";

export const cyclesManifest: ModuleManifest = {
  key: "cycles",
  groupLabel: NAV_GROUPS.INSTITUCIONAL,
  navItems: [
    {
      title: "Ciclos",
      href: "/cycle",
      icon: Network,
      permissions: ["project-structure.read"],
      order: 10,
    },
  ],
};
