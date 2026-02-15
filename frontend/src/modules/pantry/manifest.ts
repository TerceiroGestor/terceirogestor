import { Package } from "lucide-react";
import type { ModuleManifest } from "@/modules/types";

export const pantryManifest: ModuleManifest = {
  key: "pantry",
  groupLabel: "Módulos",
  navItems: [
    {
      title: "Despensa",
      href: "/pantry",
      icon: Package,
      permissions: ["pantry.read"],
    },
  ],
};

