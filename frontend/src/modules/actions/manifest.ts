"use client";

import { ClipboardList } from "lucide-react";
import type { ModuleManifest } from "@/modules/types";

export const actionsManifest: ModuleManifest = {
  key: "actions",
  groupLabel: "Operações",
  navItems: [
    {
      title: "Ações",
      href: "/actions",
      icon: ClipboardList,
      permissions: ["actions.read"],
      order: 5,
    },
  ],
};

