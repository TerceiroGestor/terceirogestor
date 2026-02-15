import { Home } from "lucide-react";
import type { ModuleManifest } from "@/modules/types";

export const coreManifest: ModuleManifest = {
  key: "core",
  groupLabel: "Análises",
  navItems: [{ title: "Painel", href: "/dashboard", icon: Home, exact: true }],
};

