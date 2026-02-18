"use client";

import { FolderKanban } from "lucide-react";
import type { ModuleManifest } from "@/modules/types";
import { NAV_GROUPS } from "@/modules/nav/groups";

export const projectsManifest: ModuleManifest = {
  key: "projects",
  groupLabel: NAV_GROUPS.GESTAO,
  navItems: [
    {
      title: "Projetos",
      href: "/projects",
      icon: FolderKanban,
      permissions: ["projects.read"],
      order: 30,
    },
  ],
};
