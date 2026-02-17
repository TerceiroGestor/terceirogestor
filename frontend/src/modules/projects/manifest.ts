import { FolderKanban } from "lucide-react";
import type { ModuleManifest } from "@/modules/types";

export const projectsManifest: ModuleManifest = {
  key: "projects",
  groupLabel: "Organização",
  navItems: [
    {
      title: "Projetos",
      href: "/projects",
      icon: FolderKanban,
      permissions: ["projects.read"],
      order: 20,
    },
  ],
};

