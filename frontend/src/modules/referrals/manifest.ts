import { Send } from "lucide-react";
import type { ModuleManifest } from "@/modules/types";
import { NAV_GROUPS } from "@/modules/nav/groups";

export const referralsManifest: ModuleManifest = {
  key: "referrals",
  groupLabel: NAV_GROUPS.OPERACOES,
  navItems: [
    {
      title: "Encaminhamentos",
      href: "/referrals",
      icon: Send,
      permissions: ["referrals.read"],
      order: 8,
    },
  ],
};
