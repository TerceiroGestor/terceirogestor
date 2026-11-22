import { HeartHandshake } from "lucide-react";
import type { ModuleManifest } from "@/modules/types";
import { NAV_GROUPS } from "@/modules/nav/groups";

export const attendancesManifest: ModuleManifest = {
  key: "attendances",
  groupLabel: NAV_GROUPS.OPERACOES,
  navItems: [
    {
      title: "Atendimentos",
      href: "/attendances",
      icon: HeartHandshake,
      permissions: ["attendances.read"],
      order: 7,
    },
  ],
};
