"use client";

import { ListTodo } from "lucide-react";
import type { ModuleManifest } from "@/modules/types";
import { NAV_GROUPS } from "@/modules/nav/groups";

export const tasksManifest: ModuleManifest = {
  key: "tasks",
  groupLabel: NAV_GROUPS.GESTAO,
  navItems: [
    {
      title: "Tarefas",
      href: "/tasks",
      icon: ListTodo,
      permissions: ["tasks.read"],
      order: 99,
      // Modulo criado so pra testar a padronizacao visual, nao faz parte
      // do modelo de negocio - desativado (cinza, sem clique - mesmo
      // mecanismo de `comingSoon()` em sidebar-placeholders.ts) em vez de
      // removido, pra nao esquecer que ele existe se for reaproveitado.
      disabled: true,
      badge: "Desativado",
    },
  ],
};
