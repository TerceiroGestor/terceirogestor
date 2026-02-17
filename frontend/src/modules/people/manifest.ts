import { Users } from "lucide-react";
import type { ModuleManifest } from "@/modules/types";

export const peopleManifest: ModuleManifest = {
  key: "people",
  groupLabel: "Cadastros",
  navItems: [
    {
      title: "Pessoas",
      href: "/people",
      icon: Users,
      permissions: ["people.read"],
      order: 10,
    },
  ],
};
