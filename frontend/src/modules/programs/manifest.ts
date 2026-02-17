import { Layers } from "lucide-react";
import type { ModuleManifest } from "@/modules/types";

export const programsManifest: ModuleManifest = {
  key: "programs",
  groupLabel: "Organização",
  navItems: [
    {
      title: "Programas",
      href: "/programs",
      icon: Layers,
      permissions: ["programs.read"],
      order: 10,
    },
  ],
};

