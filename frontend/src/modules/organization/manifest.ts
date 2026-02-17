"use client";

import { FolderKanban, Layers, LayoutGrid } from "lucide-react";
import type { ModuleManifest } from "@/modules/types";

export const organizationManifest: ModuleManifest = {
  key: "organization",
  groupLabel: "Organização",
  navItems: [
    {
      title: "Organização",
      href: "/projects",
      icon: LayoutGrid,
      order: 1,
      children: [
        {
          title: "Programas",
          href: "/programs",
          icon: Layers,
          permissions: ["programs.read"],
          order: 10,
        },
        {
          title: "Projetos",
          href: "/projects",
          icon: FolderKanban,
          permissions: ["projects.read"],
          order: 20,
        },
      ],
    },
  ],
};
